'use strict';
const path = require('path');
const util = require('util');
const {Parser} = require('../parser/Parser');
const TypeMap = require('../type-system/TypeLibrary');
//const BuiltinTypes = require('../type-system/types');
const {implement, Annotable, Secured} = require('./common');

const TypeNamePattern = /^([a-zA-Z][\w\-_$]*)(\?)?$/;

class LibraryBase {

  constructor(def = {}) {
    this.uses = {};
    this.types = {};
    this.resourceTypes = null; // TODO
    this.traits = null; // TODO
    this.securitySchemes = null; // TODO
    this.annotationTypes = null;

    if (def.types)
      this.types.addTypes(def.types);

    if (def.annotationTypes)
      def.annotationTypes.forEach(r => this.addAnnotationType(r));
  }

  addType(def) {
    if (!def)
      throw new Error('You must provide type definition');
    if (!def.name)
      throw new Error('You must provide type name');
    if (this.types[def.name])
      throw new Error(`${def.name} already defined in library`);
    const t = this.createType(def);
    this.types[def.name] = t;
    return t;
  }

  addTypes(...defs) {
    const orgGetType = this.getType;
    const creating = {};
    try {
      this.getType = (n) => {
        let t = orgGetType.call(this, n, true);
        if (!t) {
          const fn = creating[n];
          if (fn) {
            delete creating[n];
            t = fn();
          } else
            throw new Error(`Type "${n}" not found`);
        }
        return t;
      };
      // Check if types are already defined
      for (const decl of defs) {
        if (!decl.name)
          throw new Error('You must provide type name');
        if (this.types[decl.name] || creating[decl.name])
          throw new Error(`${decl.name} already defined in library`);
        creating[decl.name] = () => {
          const t = this.createType(decl);
          this.types[decl.name] = t;
          return t;
        };
      }
      let x;
      for (const k of Object.keys(creating)) {
        x = creating[k];
        if (x) x();
      }
    } finally {
      // Restore original getType function
      delete this.getType;
    }
  }

  getType(n, silent) {
    if (typeof n === 'string')
      n = parseTypeName(n);
    if (typeof n === 'string') {
      if (BuiltinTypes[n])
        return new BuiltinTypes[n](this, {name: n});

      let t = this.types[n];
      if (t)
        return t;
      if (n.match(TypeNamePattern)) {
        if (!silent)
          throw new Error(`Type "${n}" not found`);
        return;
      }
      const m = n.match(/^([^.]+)\.([^.]+)$/);
      if (m) {
        const lib = this.uses[m[1]];
        if (!lib) {
          if (!silent)
            throw new Error(`Unknown library "${m[1]}". You may have forgotten to add it to the "uses".`);
          return;
        }
        return lib.getType(m[2], silent);
      }
    }
    return this.createType(n);
  }

  createType(def) {
    if (!def)
      throw new Error('You must provide type definition');

    const m = def.name && def.name.match(TypeNamePattern);
    if (m && m[2])
      def = {...def, name: m[1], required: false};

    let t;
    let type = def.type;
    if (type instanceof BuiltinTypes.any) {
      t = this.createType({
        ...def,
        type: type.subType
      });
      t.type = [type];
      return t;
    }

    if (typeof type === 'object' && !Array.isArray(type)) {
      return this.createType({
        ...def,
        type: this.createType(type)
      });
    }

    type = type || (def.properties ? 'object' : 'string');
    if (typeof type === 'string')
      type = parseTypeName(type);
    if (Array.isArray(type))
      type = type.map(parseTypeName);

    try {
      if (BuiltinTypes[type]) {
        return new BuiltinTypes[type](this, {...def, type: null});
      }

      def.type = type;
      t = Array.isArray(type) ? type[0] : type;
      const t2 = this.getType(t);
      return new BuiltinTypes[t2.subType](this, def);

    } catch (e) {
      if (def.name && !e.type) {
        e.type = def.name;
        e.message = `Can't create ${def.name}. ` + e.message +
            (def.METADATA ?
                ' at ' + def.METADATA.filename : '');

      }
      throw e;
    }
  }

  addAnnotationType(def) {
    this.annotationTypes = this.annotationTypes || {};
    this.annotationTypes[def.name] = this.createType(def);
  }

  async loadFile(filename, options = {}) {
    const parser = new Parser(options);
    const doc = await parser.parseFile(filename);
    console.log(util.inspect(doc, null, 20, true));
    return ;
    try {
      return this._load(doc, {
        rootPath: doc.METADATA.rootPath,
        filename: doc.METADATA.filename
      });
    } catch (e) {
      e.filename = e.filename || doc.METADATA.filename;
      throw e;
    }
  }

  async _load(doc, ctx) {
    if (doc.uses_) {
      for (const k of Object.keys(doc.uses)) {
        const lib = this.uses[k] = new Library();
        await lib.loadFile(doc.uses[k], {...ctx, filename: null});
      }
    }
    if (doc.types) {
      const types = [];
      for (const k of Object.keys(doc.types)) {
        const o = doc.types[k];
        types.push({...o, name: k, METADATA: o.METADATA || doc.METADATA});
      }
      this.addTypes(...types);
    }
  }

}

function parseTypeName(v, def) {
  const parse = (v) => {
    if (v.includes('|')) {
      return {
        name: def && def.name,
        displayName: def && def.displayName,
        type: 'union',
        anyOf: v.split(/\s*\|\s*/).map(parseTypeName)
      };
    }
    if (v.endsWith('[]')) {
      return {
        name: def && def.name,
        displayName: def && def.displayName,
        type: 'array',
        items: parseTypeName(v.substring(0, v.length - 2))
      };
    }
    return v;
  };
  return v.match(/^\[[^\]]+]$/) ?
      v.split(/\s*,\s*/).map(parse) : parse(v);
}

class Library extends LibraryBase {

}

implement(LibraryBase, Annotable);

module.exports = {
  Types: BuiltinTypes,
  LibraryBase,
  Library
};
