'use strict';

const ValidationError = require('./ValidationError');
const {coalesce} = require('../helpers');

/**
 *
 * @class AnyType
 */
class AnyType {

  constructor(library, def) {
    Object.defineProperty(this, '_library', {
      enumerable: false,
      value: library
    });
    this.attributes = {};
    Object.assign(this, {
      name: def.name,
      displayName: def.displayName,
      default: def.default,
      required: def.required,
      readonly: def.readonly,
      writeonly: def.writeonly
    });
    this.type = [];
    if (def.type) {
      const BuiltinTypes = require('../type-system/types');
      const types = Array.isArray(def.type) ? def.type : [def.type];
      for (const n of types) {
        if (BuiltinTypes[n]) {
          if (this.baseType !== n)
            throw new TypeError(`Can't extend ${this.baseType} type from ${n} type`);
          continue;
        }
        const t = library.get(n);
        if (this.subType !== t.subType)
          throw new TypeError(`Can't extend ${this.subType} type from ${t.subType} type`);
        if (t.name !== t.baseType)
          this.type.push(t);
      }
    }
  }

  get baseType() {
    return 'any';
  }

  get subType() {
    return this.baseType;
  }

  get name() {
    return this.attributes.name;
  }

  set name(v) {
    this.attributes.name = v == null ? v : '' + v;
  }

  get displayName() {
    return this.attributes.displayName;
  }

  set displayName(v) {
    this.attributes.displayName = v == null ? v : '' + v;
  }

  get required() {
    return this.attributes.required;
  }

  set required(v) {
    this.attributes.required = v == null ? v : !!v;
  }

  get default() {
    return this.attributes.default;
  }

  set default(v) {
    this.attributes.default = v;
  }

  get readonly() {
    return this.attributes.readonly;
  }

  set readonly(v) {
    this.attributes.readonly = v == null ? v : !!v;
  }

  get writeonly() {
    return this.attributes.writeonly;
  }

  set writeonly(v) {
    this.attributes.writeonly = v == null ? v : !!v;
  }

  clone() {
    const Clazz = Object.getPrototypeOf(this).constructor;
    const t = new Clazz(this._library, {});
    Object.assign(t.attributes, this.attributes);
    t.type.push(...this.type);
    return t;
  }

  get(n, defaultValue) {
    let x = this.attributes[n];
    if (x !== undefined)
      return x;
    for (let i = this.type.length - 1; i >= 0; i--) {
      x = this.type[i].get(n);
      if (x !== undefined)
        return x;
    }
    return defaultValue;
  }

  flatten() {
    if (!this.type.length)
      return [this];
    const combinations = [];
    const Clazz = Object.getPrototypeOf(this).constructor;
    const iterateTypes = (typ, startIdx) => {
      for (let i = startIdx; i < this.type.length; i++) {
        const tt = this.type[i];
        const c = tt.flatten();
        for (let l = 0; l < c.length; l++) {
          let t2;
          if (l < c.length - 1) {
            t2 = typ.clone();
            c[l]._copyTo(t2, i === 0);
            iterateTypes(t2, i + 1);
          } else {
            c[l]._copyTo(typ, i === 0);
          }
        }
      }
      this._copyTo(typ, true);
      combinations.push(typ);
      typ.type = [];
    };
    const base = new Clazz(this._library, {name: this.name});
    iterateTypes(base, 0);
    return combinations;
  }

  validator(options = {}) {
    const validate = this._generateValidateFunction(options);
    const throwOnError = options.throwOnError;
    return (value) => {
      const errors = [];
      const errorFn = (e) => {
        errors.push(e);
      };
      const v = validate(value, this.name, errorFn);
      const valid = v !== undefined;
      if (!valid && !errors.length) {
        errorFn({
          message: 'Validation failed',
          errorType: 'unknown'
        });
      }
      if (throwOnError && errors.length) {
        const ee = new ValidationError(errors[0].message);
        // @ts-ignore
        ee.errors = errors;
        throw ee;
      }
      return errors.length ? {valid, errors} : {valid, value: v};
    };
  }

  _copyTo(target, overwrite) {
    for (const k of Object.keys(this.attributes))
      target.attributes[k] = overwrite ?
          coalesce(this.attributes[k], target.attributes[k]) :
          coalesce(target.attributes[k], this.attributes[k]);
  }

  _generateValidateFunction(options) {
    const defaultVal = this.default;
    const types = this.flatten();
    const functions = [];
    const isUnion = types.length > 1;
    for (const typ of types) {
      const varNames = [];
      const varValues = [];
      if (defaultVal !== undefined) {
        varNames.push('defaultVal');
        varValues.push(defaultVal);
      }
      const o = typ._generateValidationCode({...options, isUnion});
      if (o.variables)
        for (const n of Object.keys(o.variables)) {
          varNames.push(n);
          varValues.push(o.variables[n]);
        }
      const code = `return (value, path, error) => {
            ${defaultVal !==
      undefined ? 'if (value == null) value = defaultVal;' : ''}             
            ${o.code}
return value;\n}`;
      const fn = new Function(...varNames, code)(...varValues);
      functions.push(fn);
    }
    if (isUnion) {
      return (value, path, error) => {
        let _error;
        for (const fn of functions) {
          const v = fn(value, path, (e) => {
            _error = _error || e;
          });
          if (v !== undefined)
            return v;
        }
        error(_error || {
          message: 'Value does not match any of union types',
          errorType: 'no-type-matched',
          path
        });
      };
    }
    return functions[0];
  }

  _generateValidationCode(options) {
    const data = {code: '', variables: {}};
    data.variables.name = this.name;
    if (this.required &&
        (options.ignoreRequire !== true ||
            (Array.isArray(options.ignoreRequire) &&
                options.ignoreRequire.includes(this.name)))) {
      data.code += `     
    if (value == null) {
        error({
            message: 'Value required for ' + name,
            errorType: 'value-required',
            path
        });
        return;
    }
`;
    }
    data.code += '\n    if (value == null) return value;';
    return data;
  }

}

module.exports = AnyType;
