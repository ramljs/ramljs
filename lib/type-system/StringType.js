'use strict';
const AnyType = require('./AnyType');

const BuiltinFacets = ['enum', 'pattern', 'minLength', 'maxLength'];

class StringType extends AnyType {

  constructor(library, decl) {
    super(library, decl);
    BuiltinFacets.forEach(n => {
      if (decl[n] !== undefined)
        this.set(n, decl[n]);
    });
  }

  get baseType() {
    return 'string';
  }

  get typeFamily() {
    return 'scalar';
  }

  set(n, value) {
    if (n === 'pattern' && value) {
      this.attributes.pattern = Array.isArray(value) ? value : [value];
      return;
    }
    if (n === 'enum' && value) {
      this.attributes.enum = Array.isArray(value) ? value : [value];
      return;
    }
    super.set(n, value);
  }

  hasFacet(n) {
    return BuiltinFacets.includes(n) || super.hasFacet(n);
  }

  _mergeOnto(target, overwrite) {
    let _pattern = target.attributes.pattern;
    if (this.attributes.pattern) {
      _pattern = _pattern || [];
      _pattern.push(...this.attributes.pattern);
    }

    let _enum = target.attributes.enum;
    if (this.attributes.enum) {
      _enum = _enum || [];
      _enum.push(...this.attributes.enum);
    }

    let minLength = target.attributes.minLength;
    if (this.attributes.minLength != null) {
      minLength = overwrite || minLength == null ?
          this.attributes.minLength :
          Math.min(minLength, this.attributes.minLength);
    }

    let maxLength = target.attributes.maxLength;
    if (this.attributes.maxLength != null) {
      maxLength = overwrite || maxLength == null ?
          this.attributes.maxLength :
          Math.max(maxLength, this.attributes.maxLength);
    }
    super._mergeOnto(target, overwrite);
    if (_pattern)
      target.attributes.pattern = _pattern;
    if (_enum)
      target.attributes.enum = _enum;
    if (minLength != null)
      target.attributes.minLength = minLength;
    if (maxLength != null)
      target.attributes.maxLength = maxLength;
  }

  _generateValidationCode(options) {
    const data = super._generateValidationCode(options);
    const {strictTypes} = options;
    const coerce = options.coerceTypes || options.coerceJSTypes;
    const enums = this.attributes.enum;
    if (enums)
      data.variables.enums = new Set(enums);
    const minLength = this.attributes.minLength || 0;
    const maxLength = this.attributes.maxLength || 0;
    const patterns = this.attributes.pattern;
    if (patterns) {
      data.variables.patterns = Array.isArray(patterns) ?
          patterns.map(x => new RegExp(x)) :
          (patterns ? [new RegExp(patterns)] : null);
    }
    data.code += `
    if (!(typeof value === 'string'`;
    if (!strictTypes)
      data.code +=
          ` || (typeof value === 'number' || typeof value === 'bigint')`;
    data.code += `)
    ) {
        error({
            message: 'Value must be a string',
            errorType: 'invalid-data-type',
            path
        });
        return;
    }            
`;
    data.code += `
    const v = String(value);`;
    if (enums)
      data.code += `
    if (!enums.has(v)) {
        error({
            message: 'Value for "' + name + '" must be a one of enumerated value',
            errorType: 'invalid-enum-value',
            path
        });
        return;
    }
`;
    if (minLength != null)
      data.code += `
    if (v.length < ${minLength}) {
        error({
            message: 'Minimum accepted length is ${minLength}, actual ' + v.length,
            errorType: 'invalid-value-length',
            path,                
            min: ${minLength}${maxLength ? ', max: ' + maxLength : ''},                
            actual: v.length
        });
        return;
    }
`;
    if (maxLength)
      data.code += `
    if (v.length > ${maxLength}) {
        error({
            message: 'Maximum accepted length is ${maxLength}, actual ' + v.length,
            errorType: 'invalid-value-length',
            path,
            ${minLength ? 'min: ' + minLength + ', ' : ''}max: ${maxLength},               
            actual: v.length
        });
        return;
    }
`;
    if (patterns)
      data.code += `
    let matched;
    const patternLen = patterns.length;
    for (let i = 0; i < patternLen; i++) {
        if (v.match(patterns[i])) {
            matched = true;
            break;
        }
    }
    if (!matched) {
        error({
            message: 'Value does not match required format',
            errorType: 'invalid-value-format',
            path
        });
        return;
    }
`;
    if (coerce)
      data.code += '\n    value = v;';
    return data;
  }
}

module.exports = StringType;
