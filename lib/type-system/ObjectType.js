'use strict';
const AnyType = require('./AnyType');

class ObjectType extends AnyType {

  constructor(library, def) {
    super(library, def);
    this.properties = {};
    Object.assign(this, {
      discriminator: def.discriminator,
      discriminatorValue: def.discriminatorValue,
      additionalProperties: def.additionalProperties,
      minProperties: def.minProperties,
      maxProperties: def.maxProperties,
      typeOf: def.typeOf
    });
    if (def.properties)
      this.addProperties(def.properties);
  }

  get baseType() {
    return 'object';
  }

  get discriminator() {
    return this.attributes.discriminator;
  }

  set discriminator(v) {
    this.attributes.discriminator = v == null ? v : '' + v;
  }

  get discriminatorValue() {
    return this.attributes.discriminatorValue;
  }

  set discriminatorValue(v) {
    this.attributes.discriminatorValue = v;
  }

  get additionalProperties() {
    return this.attributes.additionalProperties;
  }

  set additionalProperties(v) {
    this.attributes.additionalProperties = v == null ? v : !!v;
  }

  get minProperties() {
    return this.attributes.minProperties;
  }

  set minProperties(v) {
    this.attributes.minProperties = v == null ? v : (parseInt(v, 10) || 0);
  }

  get maxProperties() {
    return this.attributes.maxProperties;
  }

  set maxProperties(v) {
    this.attributes.maxProperties = v == null ? v : (parseInt(v, 10) || 0);
  }

  get typeOf() {
    return this.attributes.typeOf;
  }

  set typeOf(v) {
    if (v && typeof v !== 'function')
      throw new TypeError('Function type required for "typeOf" property');
    this.attributes.typeOf = v;
  }

  clone() {
    const t = super.clone();
    Object.assign(t.properties, this.properties);
    return t;
  }

  addProperty(name, prop) {
    if (!(prop instanceof AnyType)) {
      prop = this._library.get(
          typeof prop === 'object' ? prop : {type: prop, name});
    }
    this.properties[name] = prop;
    return prop;
  }

  addProperties(properties) {
    for (const k of Object.keys(properties))
      this.addProperty(k, properties[k]);
  }

  _copyTo(target, overwrite) {
    let minProperties = target.minProperties;
    if (this.minProperties != null) {
      minProperties = overwrite || minProperties == null ?
          this.minProperties :
          Math.min(minProperties, this.minProperties);
    }

    let maxProperties = target.maxProperties;
    if (this.maxProperties != null) {
      maxProperties = overwrite || maxProperties == null ?
          this.maxProperties :
          Math.max(maxProperties, this.maxProperties);
    }

    super._copyTo(target, overwrite);

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
        this.discriminator;
    if (discriminator)
      data.variables.discriminatorValue =
          this.discriminatorValue || this.name;
    if (this.typeOf) {
      data.variables.typeOf = this.typeOf;
      data.variables.type = this;
    }
    const additionalProperties = !options.removeAdditional &&
        (this.additionalProperties != null ?
            this.additionalProperties : true);
    const minProperties = data.variables.minProperties =
        parseInt(this.minProperties, 10) || 0;
    const maxProperties = data.variables.maxProperties =
        parseInt(this.maxProperties, 10) || 0;
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
                result.push(x.substring(name.length + 1));
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
      if (!typeOf(value, type))
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
