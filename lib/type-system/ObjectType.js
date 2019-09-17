'use strict';
const AnyType = require('./AnyType');

const BuiltinFacets = ['discriminator', 'discriminatorValue',
  'additionalProperties', 'minProperties', 'maxProperties'];

class ObjectType extends AnyType {

  constructor(library, decl) {
    super(library, decl);
    BuiltinFacets.forEach(n => {
      if (decl[n] !== undefined)
        this.set(n, decl[n]);
    });
    this.properties = {};
    this.typeOf = decl.typeOf;
    this.addProperties(decl.properties);
  }

  get baseType() {
    return 'object';
  }

  get typeFamily() {
    return 'object';
  }

  hasFacet(n) {
    return BuiltinFacets.includes(n) || super.hasFacet(n);
  }

  clone() {
    const t = super.clone();
    this._mergeOnto(t, true);
    return t;
  }

  addProperties(properties) {
    if (Array.isArray(properties)) {
      for (const prop of properties) {
        this.addProperty(prop.name, prop);
      }
    } else if (typeof properties === 'object') {
      for (const k of Object.keys(properties))
        this.addProperty(k, properties[k]);
    }
  }

  addProperty(name, prop) {
    if (prop instanceof AnyType) {
      prop = prop.clone();
      prop.attributes.name = name;
    } else {
      if (!(typeof prop === 'object'))
        prop = {type: prop};
      prop = this._library.createType({...prop, name});
    }
    prop.parent = this;
    this.properties[prop.name] = prop;
    return prop;
  }

  _mergeOnto(target, overwrite) {
    let minProperties = target.attributes.minProperties;
    if (this.attributes.minProperties != null) {
      minProperties = overwrite || minProperties == null ?
          this.attributes.minProperties :
          Math.min(minProperties, this.attributes.minProperties);
    }

    let maxProperties = target.attributes.maxProperties;
    if (this.attributes.maxProperties != null) {
      maxProperties = overwrite || maxProperties == null ?
          this.attributes.maxProperties :
          Math.max(maxProperties, this.attributes.maxProperties);
    }

    super._mergeOnto(target, overwrite);

    target.typeOf = overwrite ?
        (this.typeOf || target.typeOf) :
        (target.typeOf || this.typeOf);

    if (minProperties != null)
      target.attributes.minProperties = minProperties;
    if (maxProperties != null)
      target.attributes.maxProperties = maxProperties;

    for (const k of Object.keys(this.properties)) {
      if (overwrite)
        target.properties[k] = this.properties[k].clone();
      else {
        if (target.properties[k])
          continue;
        target.properties[k] = this.properties[k].clone();
        target.properties[k].isExtension = true;
      }
    }
  }

  _generateValidationCode(options) {
    const data = super._generateValidationCode(options);
    const discriminator = data.variables.discriminator =
        this.attributes.discriminator;
    if (discriminator)
      data.variables.discriminatorValue =
          this.attributes.discriminatorValue || this.name;
    if (this.typeOf) {
      data.variables.typeOf = this.typeOf;
      data.variables.type = this;
    }
    const additionalProperties = !options.removeAdditional &&
        (this.attributes.additionalProperties != null ?
            this.attributes.additionalProperties : true);
    const minProperties = data.variables.minProperties =
        parseInt(this.attributes.minProperties, 10) || 0;
    const maxProperties = data.variables.maxProperties =
        parseInt(this.attributes.maxProperties, 10) || 0;
    const maxErrors = data.variables.maxErrors = options.maxObjectErrors || 0;
    let ignoreRequire = options.ignoreRequire;
    const properties = data.variables.properties = this.properties;
    const propertyKeys = data.variables.propertyKeys = Object.keys(properties);
    let prePropertyValidators;
    let propertyValidators;
    if (propertyKeys.length) {
      // create a new ignoreRequire for nested properties
      if (Array.isArray(ignoreRequire)) {
        const name = this.name;
        ignoreRequire = data.variables.ignoreRequire =
            ignoreRequire.reduce((result, x) => {
              if (x.startsWith(name + '.'))
                result.push(x.substring(name.lengh + 1));
              return result;
            }, []);
      }
      /* We have to be sure if value is the object type that we are looking for
       * before coercing or removing additional properties.
       * If discriminator is not defined we can not know the object type.
       * So we apply a pre validation.
       */
      if (options.isUnion && !discriminator) {
        prePropertyValidators = data.variables.prePropertyValidators = {};
        for (const k of propertyKeys) {
          // @ts-ignore
          prePropertyValidators[k] =
              properties[k]._generateValidateFunction({
                ...options,
                ignoreRequire: false,
                coerceTypes: false,
                coerceJSTypes: false,
                removeAdditional: false,
                maxArrayErrors: 0,
                maxObjectErrors: 0,
                throwOnError: false
              });
        }
      }
      propertyValidators = data.variables.propertyValidators = {};
      for (const k of propertyKeys) {
        const opts = maxErrors > 1 ? {
          ...options,
          throwOnError: false
        } : options;
        // @ts-ignore
        propertyValidators[k] = properties[k]._generateValidateFunction(opts);
      }
    }
    data.code += `
    if (typeof value !== 'object' || Array.isArray(value)) {
        error({
                message: 'Value must be an object',
                errorType: 'invalid-data-type',
                path
            }
        );
        return;
    }
`;
    if (this.typeOf) {
      data.code += `
      if (!typeOf(type, value))
        return;
`;

    }

    if (discriminator)
      data.code += `
    if (value[discriminator] !== discriminatorValue) {
        error({
            message: 'Object\`s discriminator property (' + discriminator + 
                ') does not match to "' + discriminatorValue + '"',
            errorType: 'invalid-data',
            error,
            discriminatorValue,
            actual: value[discriminator],
        });
        return;
    }
`;
    if (!additionalProperties || minProperties || maxProperties ||
        propertyValidators)
      data.code += `    
    const valueKeys = Object.keys(value);   
`;
    if (minProperties) {
      data.code += `
    if (valueKeys.length < minProperties) {
        error({
            message: 'Minimum accepted properties ' + minProperties + ', actual ' + valueKeys.length,
            errorType: 'invalid-value-length',
            path,
            min: ${minProperties}${maxProperties ? ', max: ' +
          maxProperties : ''},
            actual: valueKeys.length
        });
        return;
    }
`;
    }
    if (maxProperties)
      data.code += `
    if (valueKeys.length > maxProperties) {
        error({
            message: 'Maximum accepted properties ' + maxProperties +', actual ' + valueKeys.length,
            errorType: 'invalid-value-length',
            path,
            ${minProperties ? 'min: ' + minProperties +
          ', ' : ''}max: ${maxProperties},
            actual: valueKeys.length
        });
        return;
    }
`;
    if (prePropertyValidators) {
      data.code += `
    const preKeys = Object.keys(prePropertyValidators);  
    for (let i = 0; i < ${propertyKeys.length}; i++) {
        const k = preKeys[i];
        const fn = prePropertyValidators[k];
        const _path = path ? path + '.' + k : k;
        let hasError;
        const vv = fn(value[k], _path, (e) => {
          hasError = true;
          error(e);
        });
        if (hasError) return;                    
    }            
            `;
    }

    // Iterate over value properties than iterate over type properties
    if (propertyValidators) {
      const needResult = options.coerceTypes || options.removeAdditional;
      data.code += `
    let numErrors = 0;        
    const subError = (...args) => {
      numErrors++;
      error(...args);
    }                        
    const prpVlds = Object.assign({}, propertyValidators);
    let keysLen = valueKeys.length;
    ${needResult ? 'const result = {};' : ''}
    for (let i = 0; i < keysLen; i++) {
        const k = valueKeys[i];
        const fn = propertyValidators[k];
        const _path = path ? path + '.' + k : k;
        if (fn) {
            delete prpVlds[k];
            const vv = fn(value[k], _path, subError);
            if (vv === undefined) {
                ${maxErrors > 1 ? `if (numErrors >= maxErrors) return;
                continue;` : 'return;'}
            }                                   
            ${needResult ? 'result[k] = vv;' : ''}                           
        }`;
      if (additionalProperties) {
        if (needResult)
          data.code += `else result[k] = value[k];`;
      } else if (!options.removeAdditional)
        data.code += `else {
            error({
                    message: 'Object type does not allow additional properties',
                    errorType: 'no-additional-allowed',
                    path: _path
                }
            );
            ${maxErrors > 1 ? 'if (++numErrors >= maxErrors) return;' : ''}
        }`;
      data.code += `         
    }
    
    const keys = Object.keys(prpVlds);
    keysLen = keys.length;
    for (let i = 0; i < keysLen; i++) {
        const k = keys[i];
        const fn = prpVlds[k];
        const _path = path ? path + '.' + k : k;
        const n = numErrors;
        const vv = fn(value[k], _path, subError);
        if (numErrors > n)
          ${maxErrors > 1 ? 'if (numErrors >= maxErrors) return;' : 'return'}
        ${needResult ? 'if (vv != undefined) result[k] = vv;' : ''}                    
    }
    
    ${needResult ? 'value = !numErrors ? result: undefined;' : ''};    
        `;
    }
    return data;
  }
}

module.exports = ObjectType;
