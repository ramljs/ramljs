'use strict';
const fs = require('fs');
const path = require('path');
const util = require('util');
const yaml = require('js-yaml');
const string_replace_async = require('string-replace-async');
const glob = require('glob');
const merge = require('putil-merge');
const isPlainObject = require('putil-isplainobject');
const schema10 = require('./schema10');

const apiValidator = schema10.get('Api')
    .validator({coerceTypes: true, throwOnError: true});

const fragmentTypes = ['DocumentationItem',
  'DataType', 'NamedExample', 'Resource', 'ResourceType', 'Trait',
  'AnnotationTypeDeclaration', 'Library', 'Overlay',
  'Extension', 'SecurityScheme'];

const RAML_HEADER_PATTERN = /^\s*#%RAML (\d\.\d)(?: (\w+))?/;
const ANNOTATION_PATTERN = /^\(([\w-_$]+)\)$/;
const _readFile = util.promisify(fs.readFile);

class Parser {

  constructor(options = {}) {
    this.resolveFile = options.resolveFile;
    this.rootPath = options.rootPath;
  }

  async defaultResolveFile(f, ctx) {
    ctx.filename = path.resolve(
        (path.isAbsolute(f) ? ctx.rootPath : ctx.currentPath), f);
    if (path.extname(ctx.filename).toLowerCase() === '.js')
      return require(ctx.filename);
    if (!fs.existsSync(ctx.filename) && path.extname(ctx.filename) === '')
      ctx.filename += '.raml';

    const result = this._cache[ctx.filename] ||
        await _readFile(ctx.filename, 'utf8');
    this._cache[ctx.filename] = result;
    return result;
  }

  async parseFile(filename) {
    this._cache = {};
    try {
      filename = path.resolve(this.rootPath || process.cwd(), filename);
      const rootPath = this.rootPath || path.dirname(filename);
      filename = path.relative(rootPath, filename);
      const ctx = {
        rootPath,
        currentPath: rootPath
      };
      return await this._parseFile(filename, ctx);
    } finally {
      delete this._cache;
    }
  }

  async _parseFile(f, ctx) {
    const content = await this._resolveFile(f, ctx);
    const doc = await this._parseContent(content, ctx);
    return this._processDocument(doc, ctx);
  }

  async _parseContent(content, ctx) {
    if (typeof content === 'object') {
      if (typeof content.raml === 'string') {
        const v = await this._parseContent(content.raml, ctx);
        merge(v, content, {
              deep: true,
              filter: (src, key) => key !== 'raml'
            }
        );
        return v;
      }
      if (typeof content.raml === 'object') {
        const o = {...content};
        o.METADATA = {...o.raml};
        if (fs.existsSync(ctx.filename))
          o.METADATA.filename = path.relative(ctx.rootPath, ctx.filename);
        delete o.raml;
        return content;
      }
      throw new Error(`Definition object must contain a valid "raml" property`);
    }

    if (typeof content !== 'string')
      throw new TypeError(`Invalid argument`);

    const header = this._extractHeader(content);

    const currentPath = path.dirname(ctx.filename);
    content = await string_replace_async(content, /^( *)!include (.*)/gm,
        async (m, indent, pattern) => {
          const dir = path.join(
              (path.isAbsolute(pattern) ? ctx.rootPath : currentPath), pattern);
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
      construct: (f) => {
        const promise = Promise.resolve().then(async () => {
          const ext = path.extname(f).toLowerCase();
          const _ctx = {...ctx, currentPath};
          if (ext === '' || ext === '.raml' || ext === '.js')
            return await this._parseFile(f, _ctx);
          return this._resolveFile(f, _ctx);
        });
        promises.push(promise);
        return promise;
      }
    });
    const schema = yaml.Schema.create([IncludeType]);
    let doc = await yaml.safeLoad(content, {schema});
    if (promises.length) {
      await Promise.all(promises);
      await this._deepResolvePromises(doc);
    }
    doc = {METADATA: header, ...doc};
    if (fs.existsSync(ctx.filename)) {
      doc.METADATA.filename = path.relative(ctx.rootPath, ctx.filename);
    }
    return doc;
  }

  async _resolveFile(f, ctx) {
    if (this.resolveFile) {
      ctx.filename = path.resolve(
          (path.isAbsolute(f) ? ctx.rootPath : ctx.currentPath), f);
      return this.resolveFile(f, ctx);
    }
    return this.defaultResolveFile(f, ctx);
  }

  async _deepResolvePromises(obj) {
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++)
        obj[i] = await this._deepResolvePromises(obj[i]);
      return obj;
    }
    if (isPlainObject(obj)) {
      for (const key of Object.keys(obj)) {
        obj[key] = await this._deepResolvePromises(obj[key]);
      }
      return obj;
    }
    return await obj;
  }

  _extractHeader(content) {
    const m = (typeof content === 'string') &&
        content.match(RAML_HEADER_PATTERN);
    if (m)
      return {
        version: m[1],
        fragmentType: m[2]
      };
    throw new Error(`Invalid not a valid RAML content`);
  }

  async _processDocument(doc, ctx) {
    const version = doc.METADATA.version;
    const fragmentType = doc.METADATA.fragmentType;
    if (version !== '1.0')
      throw new Error(`Unsupported RAML version (${version})`);
    if (fragmentType &&
        !fragmentTypes.includes(fragmentType))
      throw new Error(`Unknown RAML fragment type "${fragmentType}"`);
    switch (fragmentType || 'Api') {
      case 'Api': {
        return this._processApiDocument(doc, ctx);
      }
      default: {
        return doc;
      }
    }
  }

  async _processApiDocument(doc) {

    doc = apiValidator(doc).value;

    return doc;
    if ((!doc.title))
      throw new Error('Api document requires "title" property');

    const keys = Object.keys(doc);
    for (const k of keys) {
      if (k.startsWith('/')) {

      } else if (k.match(ANNOTATION_PATTERN)) {

      } else {
        if (!['METADATA', 'title', 'description', 'version', 'baseUri',
          'baseUriParameters', 'protocols', 'mediaType', 'documentation',
          'schemas', 'types', 'traits', 'resourceTypes', 'annotationTypes',
          'securitySchemes', 'securedBy', 'uses'].includes(k))
          throw new Error(`Additional "${k}" property is not allowed in Api document`);
      }
    }

    doc.title = String(doc.title);
    if (doc.documentation) {
      if (Array.isArray(doc.documentation))
        doc.documentation = [doc.documentation];
      for (const x of doc.documentation) {
        if (!x.title)
          throw new Error('"documentation.title" property is required');
        if (!x.content)
          throw new Error('"documentation.content" property is required');
      }

    }

    return doc;
  }

}

module.exports = {
  Parser
};
