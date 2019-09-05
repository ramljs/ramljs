'use strict';

const AnyType = require('./AnyType');
const ArrayType = require('./ArrayType');
const BooleanType = require('./BooleanType');
const DateOnlyType = require('./DateOnlyType');
const TimeOnlyType = require('./TimeOnlyType');
const DateTimeOnlyType = require('./DateTimeOnlyType');
const DateTimeType = require('./DateTimeType');
const IntegerType = require('./IntegerType');
const NilType = require('./NilType');
const NumberType = require('./NumberType');
const ObjectType = require('./ObjectType');
const StringType = require('./StringType');
const UnionType = require('./UnionType');

let builtInTypes;

class TypeLibrary {

  constructor() {
    this.types = {};
  }

  addType(decl) {
    if (!decl.name)
      throw new Error('You must provide type name');
    if (this.types[decl.name])
      throw new Error(`${decl.name} already defined in library`);
    const t = this.createType(decl);
    this.types[decl.name] = t;
    return t;
  }

  addTypes(declaration) {
    const orgGetType = this.getType;
    const creating = {};
    try {
      this.getType = (n) => {
        const t = orgGetType.call(this, n, true);
        if (t)
          return t;
        const fn = creating[n];
        if (fn) {
          delete creating[n];
          return fn();
        }
      };
      // Check if types are already defined
      for (const decl of declaration) {
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
      for (const k of Object.keys(creating)) {
        const x = creating[k];
        if (x)
          x();
      }
    } finally {
      // Restore original getType function
      delete this.getType;
    }
  }

  getType(n, silent) {
    const t = typeof n === 'string' ?
        this.types[n] ||
        (this !== builtInTypes && builtInTypes.getType(n, silent)) :
        this.createType(n);
    if (!(t || silent))
      throw new Error(`Type "${n}" not found`);
    return t;
  }

  createType(decl) {
    let t;
    if (decl.type instanceof AnyType) {
      t = this.createType({
        ...decl,
        type: decl.type.storedType
      });
      t.type = [decl.type];
      return t;
    }
    if (typeof decl.type === 'object' && !Array.isArray(decl.type)) {
      return this.createType({
        ...decl,
        type: this.createType(decl.type)
      });
    }
    t = decl.type ?
        (Array.isArray(decl.type) ? decl.type[0] : decl.type) :
        // @ts-ignore
        (decl.properties ? 'object' : 'string');
    const base = this.getType(this.getType(t).storedType);
    const Clazz = Object.getPrototypeOf(base).constructor;
    return new Clazz(this, decl);
  }
}

builtInTypes = new TypeLibrary();
Object.assign(builtInTypes.types, {
  'any': new AnyType(builtInTypes, {name: 'any'}),
  'array': new ArrayType(builtInTypes, {name: 'array'}),
  'boolean': new BooleanType(builtInTypes, {name: 'boolean'}),
  'date-only': new DateOnlyType(builtInTypes, {name: 'date-only'}),
  'time-only': new TimeOnlyType(builtInTypes, {name: 'time-only'}),
  'datetime-only': new DateTimeOnlyType(builtInTypes, {name: 'datetime-only'}),
  'datetime': new DateTimeType(builtInTypes, {name: 'datetime'}),
  'integer': new IntegerType(builtInTypes, {name: 'integer'}),
  'nil': new NilType(builtInTypes, {name: 'nil'}),
  'number': new NumberType(builtInTypes, {name: 'number'}),
  'object': new ObjectType(builtInTypes, {name: 'object'}),
  'string': new StringType(builtInTypes, {name: 'string'}),
  'union': new UnionType(builtInTypes, {name: 'union'})
});

module.exports = TypeLibrary;
