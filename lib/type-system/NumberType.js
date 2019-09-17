'use strict';
const AnyType = require('./AnyType');

const MinValues = {
  int64: null,
  bigint: null,
  int32: -2147483648,
  int: -9007199254740991,
  int16: -32768,
  int8: -128,
  long: 0,
  uint64: 0,
  uint32: 0,
  uint16: 0,
  uint8: 0
};

const MaxValues = {
  int64: null,
  bigint: null,
  int32: 2147483647,
  int: 9007199254740991,
  int16: 32767,
  int8: 127,
  long: null,
  uint64: null,
  uint32: 4294967295,
  uint16: 65535,
  uint8: 255
};

const BuiltinFacets = ['enum', 'minimum', 'maximum', 'format', 'multipleOf'];
const IntegerTypes = ['int64', 'bigint', 'int32', 'int', 'int16', 'int8',
  'uint64', 'uint32', 'uint16', 'uint8'];

class NumberType extends AnyType {

  constructor(library, decl) {
    super(library, decl);
    BuiltinFacets.forEach(n => {
      if (decl[n] !== undefined)
        this.set(n, decl[n]);
    });
  }

  get baseType() {
    return 'number';
  }

  get typeFamily() {
    return 'scalar';
  }

  hasFacet(n) {
    return BuiltinFacets.includes(n) || super.hasFacet(n);
  }

  _mergeOnto(target, overwrite) {
    if (target.attributes.format && this.attributes.format !==
        target.attributes.format)
      throw new Error('Can\'t merge different number formats');

    let _enum = target.attributes.enum;
    if (this.attributes.enum) {
      _enum = _enum || [];
      _enum.push(...this.enum.pattern);
    }

    let minimum = target.attributes.minimum;
    if (this.attributes.minimum != null) {
      minimum = overwrite || minimum == null ?
          this.attributes.minimum :
          Math.min(minimum, this.attributes.minimum);
    }

    let maximum = target.attributes.maximum;
    if (this.attributes.maximum != null) {
      maximum = overwrite || maximum == null ?
          this.attributes.maximum :
          Math.max(maximum, this.attributes.maximum);
    }

    let multipleOf = target.attributes.multipleOf;
    if (this.attributes.multipleOf != null) {
      multipleOf = overwrite || multipleOf == null ?
          this.attributes.multipleOf :
          Math.min(multipleOf, this.attributes.multipleOf);
    }

    super._mergeOnto(target, overwrite);

    if (_enum)
      target.attributes.enum = _enum;
    if (minimum != null)
      target.attributes.minimum = minimum;
    if (maximum != null)
      target.attributes.maximum = maximum;
    if (multipleOf != null)
      target.attributes.maximum = multipleOf;
  }

  _generateValidationCode(options) {
    const data = super._generateValidationCode(options);
    const {strictTypes} = options;
    const coerce = options.coerceTypes || options.coerceJSTypes;
    const enums = this.attributes.enum;
    if (enums)
      data.variables.enums = new Set(enums);
    const format = this.attributes.format;
    let minimum = this.attributes.minimum;
    let maximum = this.attributes.maximum;
    minimum = minimum != null ? minimum : MinValues[format];
    maximum = maximum != null ? maximum : MaxValues[format];
    const multipleOf = this.attributes.multipleOf;
    const bigFormat = ['bigint', 'int64', 'uint64', 'long'].includes(format);
    const intFormat = IntegerTypes.includes(format);
    data.variables.errorMsg1 = 'Value must be ' +
        (intFormat ? 'an integer' : 'a number') +
        (strictTypes ? '' : ' or ' +
            (intFormat ? 'integer' : 'number') +
            ' formatted string');
    data.code += `
    if (!((typeof value === 'number' || typeof value === 'bigint')`;
    if (!strictTypes)
      data.code += ` || (typeof value === 'string' && value)`;
    data.code += `)
    ) {
        error({
            message: errorMsg1,
            errorType: 'invalid-data-type',
            path
        });
        return;
    }            
`;
    data.code += `
    let n;
    try {
        n = ${bigFormat ? 'BigInt(value)' : 'Number(value)'};
    } catch (e) {
        error({
            message: e.message,
            errorType: 'invalid-data-type',
            path
        });
    }

    if (!(typeof n === 'bigint' || !isNaN(n))) {
        error({
            message: errorMsg1,
            errorType: 'invalid-data-type',
            path
        });
        return;
    }
`;
    if (intFormat)
      data.code += `
    if (typeof n === 'number' && (n - Math.floor(n) > 0)) {
        error({
            message: errorMsg1,
            errorType: 'invalid-data-type',
            path
        });
        return;
    }
`;
    if (enums)
      data.code += `
    if (!enums.has(n)) {
        error({
            message: 'Value for "' + name + '" must be a one of enumerated value',
            errorType: 'invalid-enum-value',
            path
        });
        return;
    }
`;
    if (multipleOf)
      data.code += `
    const c = typeof n === 'bigint' ?
        n / BigInt(${multipleOf}) * BigInt(${multipleOf}) :
        Math.trunc(n / ${multipleOf}) * ${multipleOf};
    if (n !== c) {
        error({
            message: 'Numeric value must be multiple of ${multipleOf}',
            errorType: 'invalid-value',
            path
        });
        return;
    }
`;
    if (minimum != null)
      data.code += `
    if (n < ${minimum}) {
        error({
            message: 'Minimum accepted value is ${minimum}, actual ' + n,
            errorType: 'range-error',
            path,
            min: ${minimum}${maximum ? ', max: ' + maximum : ''},
            actual: n
        });
        return;
    }
`;
    if (maximum)
      data.code += `
    if (n > ${maximum}) {
        error({
            message: 'Maximum accepted value is ${maximum}, actual ' + n,
            errorType: 'range-error',
            path,
            ${minimum ? 'min: ' + minimum + ', ' : ''}max: ${maximum},
            actual: n
        });
        return;
    }
`;
    if (coerce)
      data.code += '\n    value = n;';
    return data;
  }
}

module.exports = NumberType;
