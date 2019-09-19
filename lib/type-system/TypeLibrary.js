'use strict';

const BuiltinTypes = require('./types');

class TypeLibrary {

  constructor(options = {}) {
    this.items = {};
    this.onTypeNeeded = options.onTypeNeeded;
  }

  add(...defs) {
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
        if (this.items[decl.name] || creating[decl.name])
          throw new Error(`${decl.name} already defined in library`);
        creating[decl.name] = () => {
          const t = this.create(decl);
          this.items[decl.name] = t;
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

  get(nameOrDef, silent) {
    const _get = (name) => {
      if (BuiltinTypes[name])
        return new BuiltinTypes[name](this, {name});
      let t = this.items[nameOrDef];
      if (t)
        return t;
    };

    if (typeof nameOrDef === 'string') {
      const t = _get(nameOrDef);
      if (t) return t;

      if (this.onTypeNeeded) {
        const x = this.onTypeNeeded(nameOrDef);
        if (x instanceof BuiltinTypes.any)
          return x;
        if (typeof x === 'object')
          return this.create(x);
        if (typeof x === 'string')
          return _get(x);
      }
      throw new Error(`Type "${nameOrDef}" not found`);
    }
    return this.create(nameOrDef);
  }

  create(def) {
    if (!def)
      throw new Error('You must provide type definition');

    if (typeof def === 'string') {
      const x = parseTypeName(def);
      def = typeof x === 'object' || !Array.isArray(x) ? x :
          {type: x, name: 'type'};
    }

    if (def.type instanceof BuiltinTypes.any) {
      const t = this.create({
        ...def,
        type: def.type.subType
      });
      t.type = [def.type];
      return t;
    }

    if (typeof def.type === 'object' && !Array.isArray(def.type)) {
      return this.create({
        ...def,
        type: this.create({name: def.name, ...def.type})
      });
    }

    if (!def.type)
      def = {...def, type: (def.properties ? 'object' : 'any')};

    try {
      if (BuiltinTypes[def.type])
        return new BuiltinTypes[def.type](this, def);

      const t = Array.isArray(def.type) ? def.type[0] : def.type;
      const t2 = this.get(t);
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
}

function parseTypeName(v) {
  if (BuiltinTypes[v])
    return v;
  const parse = (v) => {
    if (v.includes('|')) {
      return {
        type: 'union',
        name: 'union',
        anyOf: v.split(/\s*\|\s*/).map(parseTypeName)
      };
    }
    if (v.endsWith('[]')) {
      const n = parseTypeName(v.substring(0, v.length - 2));
      return {
        type: 'array',
        name: n,
        items: n
      };
    }
    return v;
  };
  return v.match(/^\[[^\]]+]$/) ?
      v.split(/\s*,\s*/).map(parse) : parse(v);
}

module.exports = TypeLibrary;
