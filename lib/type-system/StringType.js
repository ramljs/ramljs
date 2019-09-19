'use strict';
const AnyType = require('./AnyType');

class StringType extends AnyType {

  constructor(library, def) {
    super(library, def);
    Object.assign(this, {
      enum: def.enum,
      pattern: def.pattern,
      minLength: def.minLength,
      maxLength: def.maxLength
    });
  }

  get baseType() {
    return 'string';
  }

  get enum() {
    return this.attributes.enum;
  }

  set enum(v) {
    if (v && !Array.isArray(v))
      throw new TypeError('Array type required for "enum" property');
    this.attributes.enum = v == null ? v : v.map(x => '' + x);
  }

  get pattern() {
    return this.attributes.pattern;
  }

  set pattern(v) {
    this.attributes.pattern = v == null ? v :
        Array.isArray(v) ? v.map(x => '' + x) : ['' + v];
  }

  _copyTo(target, overwrite) {

    let _enum = target.enum;
    if (this.enum) {
      _enum = _enum || [];
      _enum.push(...this.enum);
    }

    let _pattern = target.pattern;
    if (this.pattern) {
      _pattern = _pattern || [];
      _pattern.push(...this.pattern);
    }

    let minLength = target.minLength;
    if (this.minLength != null) {
      minLength = overwrite || minLength == null ?
          this.minLength :
          Math.min(minLength, this.minLength);
    }

    let maxLength = target.maxLength;
    if (this.maxLength != null) {
      maxLength = overwrite || maxLength == null ?
          this.maxLength :
          Math.max(maxLength, this.maxLength);
    }
    super._copyTo(target, overwrite);
    if (_enum)
      target.enum = _enum;
    if (_pattern)
      target.pattern = _pattern;
    if (minLength != null)
      target.minLength = minLength;
    if (maxLength != null)
      target.maxLength = maxLength;
  }

  _generateValidationCode(options) {
    const data = super._generateValidationCode(options);
    const {strictTypes} = options;
    const enums = this.enum;
    if (enums)
      data.variables.enums = new Set(enums);
    const minLength = this.minLength || 0;
    const maxLength = this.maxLength || 0;
    const patterns = this.pattern;
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
    if (options.coerceTypes)
      data.code += '\n    value = v;';
    return data;
  }
}

module.exports = StringType;
