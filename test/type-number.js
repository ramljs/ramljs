/* eslint-disable */
const assert = require('assert');
const TypeLibrary = require('../lib/types/TypeLibrary');

describe('NumberType', function() {

  const library = new TypeLibrary();

  it('should apply type check', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'number'
    });
    const validate = prm1.validator({throwOnError: true});
    assert.deepStrictEqual(validate(0), {valid: true, value: 0});
    assert.deepStrictEqual(validate(1.1), {valid: true, value: 1.1});
    assert.deepStrictEqual(validate(BigInt(123)), {
      valid: true,
      value: BigInt(123)
    });
    assert.deepStrictEqual(validate('0'), {valid: true, value: '0'});
    assert.throws(() => validate(''), /Value must be a number or number formatted string/);
    assert.throws(() => validate(false), /Value must be a number or number formatted string/);
    assert.throws(() => validate([]), /Value must be a number or number formatted string/);
    assert.throws(() => validate({}), /Value must be a number or number formatted string/);
  });

  it('should throw error for non-number values in strict mode', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'number'
    });
    const validate = prm1.validator({strictTypes: true, throwOnError: true});
    validate(0);
    validate(123.4);
    assert.throws(() => validate('0'), /Value must be a number/);
    assert.throws(() => validate(true), /Value must be a number/);
  });

  it('should coerce value to number type', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'number'
    });
    const validate = prm1.validator({coerceTypes: true});
    assert.deepStrictEqual(validate('0'), {valid: true, value: 0});
    assert.deepStrictEqual(validate('1.23'), {valid: true, value: 1.23});
  });

  it('should coerce default value to number type', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'number',
      default: '0'
    });
    const validate = prm1.validator({coerceTypes: true});
    assert.deepStrictEqual(validate(), {valid: true, value: 0});
  });

  it('should allow enum values only if set', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'number',
      enum: [1, 2, 3]
    });
    const validate = prm1.validator({throwOnError: true});
    assert.deepStrictEqual(validate(1), {valid: true, value: 1});
    assert.deepStrictEqual(validate(2), {valid: true, value: 2});
    assert.throws(() => validate('4'), /Value for "prm1" must be a one of enumerated value/);
    assert.throws(() => validate(4), /Value for "prm1" must be a one of enumerated value/);
  });

  it('should validate minimum', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'number',
      minimum: 5.5
    });
    const validate = prm1.validator({throwOnError: true});
    validate(5.5);
    assert.throws(() => validate(4),
        /Minimum accepted value is 5.5, actual 4/);
  });

  it('should validate maximum', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'number',
      maximum: 5.5
    });
    const validate = prm1.validator({throwOnError: true});
    validate(5.5);
    assert.throws(() => validate(6),
        /Maximum accepted value is 5.5, actual 6/);
  });

  it('should validate multipleOf', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'number',
      multipleOf: 0.1
    });
    const validate = prm1.validator({throwOnError: true});
    validate(1.1);
    assert.throws(() => validate(1.11),
        / Numeric value must be multiple of/);
  });

  it('should validate int8 format', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'number',
      format: 'int8'
    });
    const validate = prm1.validator({throwOnError: true});
    validate(-128);
    validate(127);
    assert.throws(() => validate(123.4),
        /Value must be an integer/);
    assert.throws(() => validate(128),
        /Maximum accepted value is/);
    assert.throws(() => validate(-129),
        /Minimum accepted value is/);
  });

  it('should validate uint8 format', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'number',
      format: 'uint8'
    });
    const validate = prm1.validator({throwOnError: true});
    validate(0);
    validate(255);
    assert.throws(() => validate(123.4),
        /Value must be an integer/);
    assert.throws(() => validate(256),
        /Maximum accepted value is/);
    assert.throws(() => validate(-1),
        /Minimum accepted value is/);
  });

  it('should validate int16 format', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'number',
      format: 'int16'
    });
    const validate = prm1.validator({throwOnError: true});
    validate(-32768);
    validate(32767);
    assert.throws(() => validate(123.4),
        /Value must be an integer/);
    assert.throws(() => validate(32768),
        /Maximum accepted value is/);
    assert.throws(() => validate(-32769),
        /Minimum accepted value is/);
  });

  it('should validate uint16 format', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'number',
      format: 'uint16'
    });
    const validate = prm1.validator({throwOnError: true});
    validate(0);
    validate(65535);
    assert.throws(() => validate(123.4),
        /Value must be an integer/);
    assert.throws(() => validate(65536),
        /Maximum accepted value is/);
    assert.throws(() => validate(-1),
        /Minimum accepted value is/);
  });

  it('should validate int format', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'number',
      format: 'int'
    });
    const validate = prm1.validator({throwOnError: true});
    validate(-9007199254740991);
    validate(9007199254740991);
    assert.throws(() => validate(123.4),
        /Value must be an integer/);
    assert.throws(() => validate(9007199254740992),
        /Maximum accepted value is/);
    assert.throws(() => validate(-9007199254740992),
        /Minimum accepted value is/);
  });

  it('should validate int32 format', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'number',
      format: 'int32'
    });
    const validate = prm1.validator({throwOnError: true});
    validate(-2147483648);
    validate(2147483647);
    assert.throws(() => validate(123.4),
        /Value must be an integer/);
    assert.throws(() => validate(2147483648),
        /Maximum accepted value is/);
    assert.throws(() => validate(-2147483649),
        /Minimum accepted value is/);
  });

  it('should validate uint32 format', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'number',
      format: 'uint32'
    });
    const validate = prm1.validator({throwOnError: true});
    validate(0);
    validate(4294967295);
    assert.throws(() => validate(123.4),
        /Value must be an integer/);
    assert.throws(() => validate(4294967296),
        /Maximum accepted value is/);
    assert.throws(() => validate(-4294967296),
        /Minimum accepted value is/);
  });

  it('should validate uint64 format', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'number',
      format: 'uint64'
    });
    const validate = prm1.validator({throwOnError: true});
    validate(0);
    assert.throws(() => validate(123.4),
        /it is not an integer/);
    assert.throws(() => validate(-1),
        /Minimum accepted value is/);
  });

});
