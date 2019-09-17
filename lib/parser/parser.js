'use strict';
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const string_replace_async = require('string-replace-async');
const glob = require('glob');
const merge = require('putil-merge');

const {
  deepResolvePromises,
  resolveFile
} = require('./common');

const fragmentTypes = ['DocumentationItem',
  'DataType', 'NamedExample', 'Resource', 'ResourceType', 'Trait',
  'AnnotationTypeDeclaration', 'Library', 'Overlay',
  'Extension', 'SecurityScheme'];

const RAML_HEADER_PATTERN = /^\s*#%RAML (\d\.\d)(?: (\w+))?/;

async function parseRaml(source, options = {}) {
  const ctx = {...options, cache: {}};

  if (typeof source === 'string' && !source.includes('\n')) {
    if (!ctx.rootPath && path.isAbsolute(source)) {
      ctx.rootPath = path.dirname(source);
      ctx.filename = path.relative(ctx.rootPath, source);
    } else
      ctx.filename = source;
    source = null;
  } else ctx.filename = ctx.filename || 'unnamed.raml';
  ctx.rootPath = ctx.rootPath || process.cwd();
  ctx.currentPath = ctx.rootPath;
  return await _parseContent(source, ctx);
}

async function _parseContent(content, ctx = {}) {

  if (!content && ctx.filename)
    content = await resolveFile(ctx.filename, ctx);

  if (typeof content === 'object') {
    if (typeof content.RAML === 'string') {
      const v = await _parseContent(content.RAML, ctx);
      merge(v, content, {
            deep: true,
            filter: (src, key) => key !== 'RAML'
          }
      );
      return v;
    }
    if (typeof content.RAML === 'object') {
      if (content.RAML.version !== '1.0')
        throw new Error(`Unsupported RAML version (${content.RAML.version})`);
      if (content.RAML.fragmentType &&
          !fragmentTypes.includes(content.RAML.fragmentType))
        throw new Error(`Unknown RAML fragment type "${content.RAML.fragmentType}"`);
      return content;
    }
    throw new Error(`Definition object must contain a valid "RAML" property`);
  }

  if (typeof content !== 'string')
    throw new TypeError(`Invalid argument`);

  const filename = path.normalize(
      path.isAbsolute(ctx.filename) ?
          path.join(ctx.rootPath, ctx.filename) :
          path.join(ctx.currentPath, ctx.filename));

  const header = extractHeader(content);

  const currentPath = path.dirname(filename);
  content = await string_replace_async(content, /^( *)!include (.*)/gm,
      async (m, indent, pattern) => {
        const dir = path.isAbsolute(pattern) ?
            path.join(ctx.rootPath, pattern) : path.join(currentPath, pattern);
        const files = glob.sync(glob.hasMagic(dir) ? dir : path.join(dir, '**/*'));
        const r = [];
        for (const f of files) {
          // Remove file extension
          r.push(path.basename(f, path.extname(f)) + ': !include ' +
              path.relative(currentPath, f));
        }
        return indent + r.join('\n' + indent);
      });

  const promises = [];
  const IncludeType = new yaml.Type('!include', {
    kind: 'scalar',
    resolve: (f) => !!f,
    construct: function(f) {
      const promise = Promise.resolve().then(async () => {
        const ext = path.extname(f).toLowerCase();
        if (ext === '' || ext === '.raml' || ext === '.js')
          return await _parseContent(null, {...ctx, currentPath, filename: f});
        return resolveFile(f, ctx);
      });
      promises.push(promise);
      return promise;
    }
  });
  const schema = yaml.Schema.create([IncludeType]);
  let doc = await yaml.safeLoad(content, {schema});
  if (promises.length) {
    await Promise.all(promises);
    await deepResolvePromises(doc);
  }
  doc = {RAML: header, ...doc};
  if (fs.existsSync(filename))
    doc.METADATA = {
      filename: filename
    };
  return doc;
}

function processFragment(obj, ctx) {

}

function extractHeader(content) {
  const m = (typeof content === 'string') &&
      content.match(RAML_HEADER_PATTERN);
  if (!m)
    throw new Error(`Invalid not a valid RAML content`);
  if (m[1] !== '1.0')
    throw new Error(`Unsupported RAML version (${m[1]})`);
  if (m[2] && !fragmentTypes.includes(m[2]))
    throw new Error(`Unknown RAML fragment type "${m[2]}"`);
  const o = {
    version: m[1]
  };
  if (m[2])
    o.fragmentType = m[2];
  return o;
}

module.exports = {
  parseRaml,
  resolveFile
};
