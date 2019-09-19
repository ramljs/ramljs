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

const IntegerFormats = ['int64', 'bigint', 'int32', 'int', 'int16', 'int8',
  'uint64', 'uint32', 'uint16', 'uint8', 'long'];
const NumberFormats = [...IntegerFormats, 'float', 'double'];

class NumberType extends AnyType {

  constructor(library, def) {
    super(library, def);
    Object.assign(this, {
      enum: def.enum,
      format: def.format,
      minimum: def.minimum,
      maximum: def.maximum,
      multipleOf: def.multipleOf
    });
  }

  get baseType() {
    return 'number';
  }

  get enum() {
    return this.attributes.enum;
  }

  set enum(v) {
    if (v && !Array.isArray(v))
      throw new TypeError('Array type required for "enum" property');
    this.attributes.enum = v == null ? v : v.map(x => parseFloat(x));
  }

  get format() {
    return this.attributes.format;
  }

  set format(v) {
    if (v && !NumberFormats.includes(v))
      throw new TypeError(`Unknown number format (${v})`);
    this.attributes.format = v;
  }

  get minimum() {
    return this.attributes.minimum;
  }

  set minimum(v) {
    this.attributes.minimum = v == null ? v : (parseFloat(v) || 0);
  }

  get maximum() {
    return this.attributes.maximum;
  }

  set maximum(v) {
    this.attributes.maximum = v == null ? v : (parseFloat(v) || 0);
  }

  get multipleOf() {
    return this.attributes.multipleOf;
  }

  set multipleOf(v) {
    this.attributes.multipleOf = v == null ? v : (parseFloat(v) || 0);
  }

  _copyTo(target, overwrite) {
    if (IntegerFormats.includes(target.format) &&
        !IntegerFormats.includes(this.format))
      throw new Error('Can\'t merge different number formats');

    let _enum = target.enum;
    if (this.enum) {
      _enum = _enum || [];
      _enum.push(...this.enum);
    }

    let minimum = target.minimum;
    if (this.minimum != null) {
      minimum = overwrite || minimum == null ?
          this.minimum :
          Math.min(minimum, this.minimum);
    }

    let maximum = target.maximum;
    if (this.maximum != null) {
      maximum = overwrite || maximum == null ?
          this.maximum :
          Math.max(maximum, this.maximum);
    }

    let multipleOf = target.multipleOf;
    if (this.multipleOf != null) {
      multipleOf = overwrite || multipleOf == null ?
          this.multipleOf :
          Math.min(multipleOf, this.multipleOf);
    }

    super._copyTo(target, overwrite);

    if (_enum)
      target.enum = _enum;
    if (minimum != null)
      target.minimum = minimum;
    if (maximum != null)
      target.maximum = maximum;
    if (multipleOf != null)
      target.maximum = multipleOf;
  }

  _generateValidationCode(options) {
    const data = super._generateValidationCode(options);
    const {strictTypes} = options;
    const enums = this.enum;
    if (enums)
      data.variables.enums = new Set(enums);
    const format = this.format;
    let minimum = this.minimum;
    let maximum = this.maximum;
    minimum = minimum != null ? minimum : MinValues[format];
    maximum = maximum != null ? maximum : MaxValues[format];
    const multipleOf = this.multipleOf;
    const bigFormat = ['bigint', 'int64', 'uint64', 'long'].includes(format);
    const intFormat = IntegerFormats.includes(format);
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
    if (options.coerceTypes)
      data.code += '\n    value = n;';
    return data;
  }
}

NumberType.NumberFormats = NumberFormats;
NumberType.IntegerFormats = IntegerFormats;
NumberType.MinValues = MinValues;
NumberType.MaxValues = MaxValues;

module.exports = NumberType;
