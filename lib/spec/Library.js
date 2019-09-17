'use strict';
const path = require('path');
const util = require('util');
const {parseRaml} = require('../parser/parser');
const AnyType = require('../type-system/AnyType');
const ArrayType = require('../type-system/ArrayType');
const BooleanType = require('../type-system/BooleanType');
const DateOnlyType = require('../type-system/DateOnlyType');
const TimeOnlyType = require('../type-system/TimeOnlyType');
const DateTimeOnlyType = require('../type-system/DateTimeOnlyType');
const DateTimeType = require('../type-system/DateTimeType');
const IntegerType = require('../type-system/IntegerType');
const NilType = require('../type-system/NilType');
const NumberType = require('../type-system/NumberType');
const ObjectType = require('../type-system/ObjectType');
const StringType = require('../type-system/StringType');
const UnionType = require('../type-system/UnionType');
const {implement, Annotable, Secured} = require('./common');

const TypeNamePattern = /^([a-zA-Z][\w\-_0-9$]*)(\?)?$/;

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
    if (typeof n === 'object')
      return this.createType(n);
    const m = n.match(/^([^.]+)\.([^.]+)$/);
    if (m) {
      const lib = this.uses[m[1]];
      if (!lib)
        throw new Error(`Unknown library "${m[1]}". You may have forgotten to add it to the "uses".`);
      return lib.getType(m[2]);
    }
    let t = this.types[n];
    if (t)
      return t;
    if (!silent)
      throw new Error(`Type "${n}" not found`);
  }

  createType(def) {
    if (!def)
      throw new Error('You must provide type definition');

    const m = def.name && def.name.match(TypeNamePattern);
    if (!m)
      throw new Error(`Invalid type name "${def.name}"`);
    def = {...def};
    def.name = m[1];
    if (m[2])
      def.required = false;

    let t;
    let type = def.type;
    if (type instanceof AnyType) {
      t = this.createType({
        ...def,
        type: type.storedType
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

    if (LibraryBase.Types[type]) {
      return new LibraryBase.Types[type](this, def);
    }

    if (typeof type === 'string') {
      const types = [];
      if (type.match(/^\[[^\]]+]$/))
        types.push(...type.split(/\s*,\s*/));
      else types.push(type);

      types.forEach((v, i) => {
        if (v.includes('|')) {
          types[i] = {
            name: def.name,
            displayName: def.displayName,
            type: 'union',
            anyOf: v.split(/\s*\|\s*/)
          };
        }
        if (v.endsWith('[]')) {
          types[i] = {
            name: def.name,
            displayName: def.displayName,
            type: 'array',
            items: v.substring(0, v.length - 2)
          };
        }
      });
      type = types;
    }

    def.type = type;
    t = Array.isArray(type) ? type[0] : type;
    try {
      const t2 = this.getType(t);
      const base = this.getType(t2.storedType);
      const Clazz = Object.getPrototypeOf(base).constructor;
      return new Clazz(this, def);
    } catch (e) {
      e.message = `Can't create type "${def.name}". ` + e.message;
      throw e;
    }
  }

  addAnnotationType(def) {
    this.annotationTypes = this.annotationTypes || {};
    this.annotationTypes[def.name] = this.createType(def);
  }

  async load(source, options = {}) {
    const doc = await parseRaml(source, options);
    console.log(util.inspect(doc, null, 20, true));
    const filename = doc.METADATA.filename;
    try {
      return this._load(doc, {
        rootPath: path.dirname(filename),
        filename: path.basename(filename)
      });
    } catch (e) {
      e.filename = e.filename || filename;
      throw e;
    }
  }

  async _load(doc, ctx) {
    if (doc.uses) {
      for (const k of Object.keys(doc.uses)) {
        const lib = this.uses[k] = new Library();
        await lib.load(doc.uses[k], {...ctx, filename: null});
      }
    }
    if (doc.types) {
      const types = [];
      for (const k of Object.keys(doc.types)) {
        types.push({...doc.types[k], name: k});
      }
      this.addTypes(...types);
    }
  }

}

LibraryBase.Types = {
  'any': AnyType,
  'array': ArrayType,
  'boolean': BooleanType,
  'date-only': DateOnlyType,
  'time-only': TimeOnlyType,
  'datetime-only': DateTimeOnlyType,
  'datetime': DateTimeType,
  'integer': IntegerType,
  'nil': NilType,
  'number': NumberType,
  'object': ObjectType,
  'string': StringType,
  'union': UnionType
};

class Library extends LibraryBase {

}

implement(LibraryBase, Annotable);

module.exports = {LibraryBase, Library};
