'use strict';
const ramlParser = require('raml-1-parser');
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const Methods = require('methods');
const string_replace_async = require('string-replace-async');

async function loadApiFile(apiFile, options = {}) {
  const content = await retrieveFile(apiFile, options);
  return loadApiContent(content,
      {
        ...options,
        filePath: options.filePath || apiFile
      });
}

exports.loadApiFile = loadApiFile;

async function loadApiContent(apiContent, options = {}) {
  if (typeof apiContent === 'string')
    apiContent = {spec: apiContent};
  if (!(typeof apiContent.spec === 'string' &&
      apiContent.spec.match(/^[\n ]*#%RAML/)))
    throw new TypeError('Invalid RAML spec');
  const apiRoot = path.dirname(options.filePath) || '/';
  const resourceHandlers = {};
  const pathSecurity = {};
  const resolveRAML = async (file) => {
    let v = await retrieveFile(file, options);
    if (!v)
      return v;
    if (typeof v === 'string')
      return processReplace(file, v);
    if (typeof v === 'object') {
      if (typeof v.spec !== 'string')
        throw new Error('Invalid file');
      v = {...v};
      v.spec = await processReplace(file, v.spec);
      return v;
    }
    return v;
  };

  const processReplace = async (file, content) => {
    const curDir = path.dirname(file);
    // Bulk includes
    content =
        await string_replace_async(content, /\n( *)!include_all *([^\n]*)/g, async (m, indent, ff) => {
          const dir = path.join((ff.startsWith('/') ? apiRoot : curDir), ff);
          const files = glob.sync(glob.hasMagic(dir) ? dir : path.join(dir, '**/*'));
          let r = '';
          for (const f of files) {
            path.join(curDir);
            // Remove file extension
            const x = path.join(path.dirname(f), path.basename(f, path.extname(f)));
            r += '\n' + indent + path.basename(x) +
                ': !include ' + path.relative(curDir, x);
          }
          return r;
        });
    // Resource tree
    content =
        await string_replace_async(content, /\n( *)!resources *([^\n\s]*)/g, async (s, indent, ff) => {
          const root = path.join((ff.startsWith('/') ? apiRoot : curDir), ff);
          if (!fs.statSync(root).isDirectory())
            throw new Error(`"${root}" does not exists`);
          const visitPath = async (node, dir) => {
            const files = fs.readdirSync(dir);
            for (const f of files) {
              const filePath = path.join(dir, f);
              if (!fs.statSync(filePath).isFile())
                continue;
              const basename = path.basename(filePath, path.extname(filePath));
              const o = node['/' + basename] = (node['/' + basename] || {});
              const v = await resolveRAML(filePath);
              if (typeof v === 'object')
                Object.assign(o, v);
              if (typeof v === 'string')
                o.spec = v;
            }
            for (const f of files) {
              const filePath = path.join(dir, f);
              const stat = fs.statSync(filePath);
              if (stat.isDirectory())
                node['/' + f] =
                    await visitPath(node['/' + f] || {}, filePath);
            }
            return node;
          };
          let r = '';
          const visitNode = (src, curPath = '', ind = '') => {
            for (const k of Object.keys(src)) {
              if (k.startsWith('/')) {
                // Merge spec into single
                const srcK = src[k];
                let spec = (srcK.spec || '');
                if (spec) {
                  const m = spec.match(/( *)\w+/);
                  if (m) {
                    spec = spec.replace(/\s+/, '');
                    spec = spec.replace(new RegExp('\\n' + m[1], 'g'), '\n');
                  }
                  spec = spec && spec.replace(/(^|\n)/g, ('\n' + ind + '  '));
                }
                r += `\n${ind}${k}:` + spec;
                for (const l of Object.keys(srcK)) {
                  if (Methods.includes(l)) {
                    resourceHandlers[curPath + k] = resourceHandlers[curPath + k] || {};
                    resourceHandlers[curPath + k][l] = srcK[l];
                  }
                }
                if (srcK.pathSecurity)
                  pathSecurity[curPath + k] = srcK.pathSecurity;
                visitNode(src[k], curPath + k, ind + '  ');
              }
            }
          };
          const tree = await visitPath({}, root);
          visitNode(tree);
          return r;
        });
    return content;
  };
  const ramlSpec = (await processReplace(options.filePath, apiContent.spec));
  const result = (await ramlParser.load(ramlSpec, {
    filePath: options.filePath,
    fsResolver: {
      content: null,
      async contentAsync(p) {
        const v = await resolveRAML(p);
        return typeof v === 'object' ? v.spec.trim() :
            typeof v === 'string' ? v.trim() : v;
      }
    }
  }));
  if (result.errors && result.errors.length) {
    const err = new Error(result.errors[0].message +
        (result.errors[0].path ? ' @'+result.errors[0].path: ''));

    err.errors = result.errors;
    throw err;
  }
  delete result.errors;
  result.resourceHandlers = resourceHandlers;
  result.pathSecurity = pathSecurity;
  return result;
}

async function retrieveFile(pathOrUrl, options) {
  let v;
  if (options.resolveFile)
    v = await options.resolveFile.call(null, pathOrUrl);
  if (v === undefined) {
    const ext = path.extname(pathOrUrl).toLowerCase();
    if (!ext && fs.existsSync(pathOrUrl + '.js'))
      return retrieveFile(pathOrUrl + '.js', options);
    if (!ext && fs.existsSync(pathOrUrl + '.raml'))
      return retrieveFile(pathOrUrl + '.raml', options);
    if (ext === '.js') {
      return require(pathOrUrl);
    }
    return fs.readFileSync(pathOrUrl, 'utf8');
  }
  return v;
}
