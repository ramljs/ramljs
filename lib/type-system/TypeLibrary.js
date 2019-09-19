'use strict';

const BuiltinTypes = require('./types');

class TypeLibrary {

  constructor(options = {}) {
    this.items = {};
    this.onTypeNeeded = options.onTypeNeeded;
    this.defaults = options.defaults || {};
  }

  add(...def) {
    if (!def.length)
      return;
    if (def.length > 1) {
      this.addAll(def);
      return;
    }
    if (this.items[def[0].name])
      throw new Error(`${def[0].name} already defined in library`);
    const t = this.create(def[0]);
    this.items[def[0].name] = t;
    return t;
  }

  addAll(defs) {
    if (Array.isArray(defs)) {
      const o = {};
      defs.forEach(x => o[x.name] = x);
      defs = o;
    }
    if (typeof defs !== 'object')
      throw new TypeError('Object instance required for "defs" argument');
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
      for (const name of Object.keys(defs)) {
        const decl = defs[name];
        decl.name = name;
        if (!name)
          throw new Error('You must provide type name');
        if (this.items[name] || creating[name])
          throw new Error(`${name} already defined in library`);
        creating[name] = () => {
          const t = this.create(decl);
          this.items[name] = t;
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

    const y = parseTypeName(def.type);
    if (typeof y === 'object') {
      Object.assign(def, y);
    }

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
        anyOf: v.split(/\s*\|\s*/).map(parseTypeName)
      };
    }
    if (v.endsWith('[]')) {
      const n = parseTypeName(v.substring(0, v.length - 2));
      return {
        type: 'array',
        items: n
      };
    }
    return v;
  };
  return v.match(/^\[[^\]]+]$/) ?
      v.split(/\s*,\s*/).map(parse) : parse(v);
}

module.exports = TypeLibrary;
