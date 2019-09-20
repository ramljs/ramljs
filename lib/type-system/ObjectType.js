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
    const m = name.match(/^([^?!]+)([?|!])?$/);
    name = m[1];
    const required = m[2] === '?' ? false :
        (m[2] === '!' ? true : undefined);
    if (!(prop instanceof AnyType)) {
      prop = this._library.create({
        type: prop,
        required
      });
    }
    if (!(prop instanceof AnyType)) {
      prop = typeof prop === 'object' ? {...prop} : {type: prop};
      if (required !== undefined)
        prop.required = required;
      prop = this._library.get(prop);
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
        (this.additionalProperties != null ? this.additionalProperties :
            this._library.defaults.additionalProperties != null ?
                this._library.defaults.additionalProperties : true);
    const minProperties = data.variables.minProperties =
        parseInt(this.minProperties, 10) || 0;
    const maxProperties = data.variables.maxProperties =
        parseInt(this.maxProperties, 10) || 0;
    const maxErrors = data.variables.maxErrors = options.maxObjectErrors || 0;

    const propertyKeys = Object.keys(this.properties);
    let properties;
    let rxproperties;
    if (propertyKeys.length) {
      data.variables.propertyKeys = propertyKeys;
      properties = data.variables.properties = {};
      rxproperties = data.variables.rxproperties = [];
      const opts = maxErrors > 1 ? {...options, throwOnError: false} : options;
      for (const k of propertyKeys) {
        const m = k.match(/^\/(.*)\/$/);
        if (m)
          rxproperties.push({
            type: this.properties[k],
            fn: this.properties[k]._generateValidateFunction(opts),
            regexp: m && new RegExp(m[1])
          });
        properties[k] = {
          type: this.properties[k],
          fn: this.properties[k]._generateValidateFunction(opts),
          regexp: m && new RegExp(m[1])
        };
      }
    }
    const needResult = properties && options.coerceTypes ||
        options.removeAdditional;

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

    if (this.typeOf)
      data.code += `
      if (!typeOf(value, type))
        return;
`;

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

    if (!additionalProperties || minProperties || maxProperties || properties)
      data.code += `    
    const valueKeys = Object.keys(value);`;

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

    // Iterate over value properties than iterate over type properties
    if (properties) {
      data.code += `      
    ${options.isUnion && !discriminator ? `
    for (let i = 0; i < ${propertyKeys.length}; i++) {
      const k = propertyKeys[i];
      const p = properties[k];
      if (p.type.isExtension) {
        if (p.regexp) {
          if (!valueKeys.find(x => x.match(p.regexp)))
            return;
        } else          
            if (!value.hasOwnProperty(k)) return;
      }      
    }` : ''}
      
    let numErrors = 0;        
    const subError = (...args) => {
      numErrors++;
      error(...args);
    };
    
    ${needResult ? 'const result = {};' : ''}        
    const prpVlds = Object.assign({}, properties);
    let keysLen = valueKeys.length;
    for (let i = 0; i < keysLen; i++) {
      const k = valueKeys[i];
      const _path = path ? path + ' | ' + k : k;
      const p = properties[k] || (
          rxproperties.length &&
          rxproperties.find(x=> k.match(x.regexp)))                           
      if (p) {          
          delete prpVlds[k];
          const vv = p.fn(value[k], _path, subError, {name: k});
          if (vv === undefined) {
              ${maxErrors > 1 ? `if (numErrors >= maxErrors) return;
              continue;` : 'return;'}
          }                                   
          ${needResult ? 'result[k] = vv;' : ''}                           
      }`;
      if (additionalProperties) {
        if (needResult)
          data.code += ` else result[k] = value[k];`;
      } else if (!options.removeAdditional)
        data.code += ` else {
            error({
                    message: path + ' does not allow additional property ('+
                        k +')',
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
        const p = prpVlds[k];
        if (p.regexp)
          continue;          
        const _path = path ? path + ' | ' + k : k;
        const n = numErrors;
        const vv = p.fn(value[k], _path, subError, {name: k});
        if (numErrors > n)
          ${maxErrors > 1 ? 'if (numErrors >= maxErrors) return;' : 'return;'}
        ${needResult ? 'if (vv !== undefined) result[k] = vv;' : ''}                    
      }
      `;
    }
    if (needResult)
      data.code += '\n    value = !numErrors ? result: undefined;';

    return data;
  }
}

module.exports = ObjectType;
