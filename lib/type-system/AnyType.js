'use strict';

const ValidationError = require('./ValidationError');

const BuiltinFacets = ['name', 'displayName', 'description', 'default',
  'required', 'examples', 'example'];

/**
 *
 * @class AnyType
 */
class AnyType {

  constructor(library, decl) {
    library = library || new (require('../spec/Library').Library);
    if (decl.examples && decl.example)
      throw new Error('Can\'t use "example" and "examples" facets at same time');
    Object.defineProperty(this, '_library', {
      enumerable: false,
      value: library
    });
    this.type = decl.type;
    /*this.type = [];
    if (decl.type) {
      const types = Array.isArray(decl.type) ? decl.type : [decl.type];
      for (const n of types) {
        const t = library.getType(n);
        if (this.storedType !== t.storedType)
          throw new TypeError(`Can't extend ${this.storedType} type from ${t.storedType} type`);
        if (t.name !== t.baseType)
          this.type.push(t);
      }
    }*/
    this.annotations = {};
    this.facets = {};
    this.attributes = {};
    if (decl.annotations) {
      decl.annotations.forEach(x => this.annotations[x.name] = x.value);
    }
    if (decl.facets) {
      decl.facets.forEach(x => this.facets[x.name] = library.getType(x));
    }
    BuiltinFacets.forEach(n => {
      if (decl[n] !== undefined)
        this.set(n, decl[n]);
    });
  }

  get name() {
    return this.attributes.name;
  }

  get typeFamily() {
    return 'any';
  }

  get baseType() {
    return 'any';
  }

  get storedType() {
    return this.baseType;
  }

  clone() {
    const Clazz = Object.getPrototypeOf(this).constructor;
    const t = new Clazz(this._library, {
      name: this.name
    });
    this._mergeOnto(t, true);
    return t;
  }

  get(n, defaultValue) {
    if (!this.hasFacet(n))
      throw new Error(`Type ${this.name} has no facet named "${n}"`);
    const x = this.attributes[n];
    if (x !== undefined)
      return x;
    for (let i = this.type.length - 1; i >= 0; i--) {
      const xx = this.type[i].attributes[n];
      if (xx)
        return xx;
    }
    return defaultValue;
  }

  set(n, value) {
    if (!this.hasFacet(n))
      throw new Error(`Type ${this.name} has no facet named "${n}"`);
    this.attributes[n] = value;
  }

  hasFacet(n) {
    return !!(BuiltinFacets.includes(n) || this.getUserDefinedFacet(n));
  }

  getUserDefinedFacet(n) {
    const x = this.facets[n];
    if (x)
      return x;
    for (let i = this.type.length - 1; i >= 0; i--) {
      const xx = this.type[i].facets[n];
      if (xx)
        return xx;
    }
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
            c[l]._mergeOnto(t2, i === 0);
            iterateTypes(t2, i + 1);
          } else {
            c[l]._mergeOnto(typ, i === 0);
          }
        }
      }
      this._mergeOnto(typ, true);
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
      const v = validate(value, this.attributes.name, errorFn);
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

  _mergeOnto(target, overwrite) {
    for (const k of this.type) {
      const i = target.type.find(y => y.name === k.name);
      if (i) {
        if (overwrite) target[i] = k;
        continue;
      }
      target.type.push(k);
    }
    for (const k of Object.keys(this.attributes))
      target.attributes[k] = overwrite ?
          (this.attributes[k] || target.attributes[k]) :
          (target.attributes[k] || this.attributes[k]);
    Object.assign(target.annotations, this.annotations);
    Object.assign(target.facets, this.facets);
  }

  _generateValidateFunction(options) {
    const defaultVal = this.attributes.default;
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
    if ((this.attributes.required || this.attributes.required == null) &&
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
