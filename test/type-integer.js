/* eslint-disable */
const assert = require('assert');
const {TypeLibrary} = require('../lib/types/TypeLibrary');

describe('IntegerType', function() {

  const library = new TypeLibrary();

  it('should validate compatible values', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'integer'
    });
    const validate = prm1.validator();
    assert.strictEqual(validate(0), 0);
    assert.strictEqual(validate(11), 11);
    assert.strictEqual(validate(BigInt(123)), BigInt(123));
    assert.strictEqual(validate('0'), '0');
    assert.throws(() => validate(''), /Value must be an integer or integer formatted string/);
    assert.throws(() => validate('1.2'), /Value must be an integer or integer formatted string/);
    assert.throws(() => validate(false), /Value must be an integer or integer formatted string/);
    assert.throws(() => validate([]), /Value must be an integer or integer formatted string/);
    assert.throws(() => validate({}), /Value must be an integer or integer formatted string/);
  });

  it('should throw error for non-integer values in strict mode', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'integer'
    });
    const validate = prm1.validator({strictTypes: true});
    validate(0);
    validate(123);
    assert.throws(() => validate(123.4), /Value must be an integer/);
    assert.throws(() => validate('0'), /Value must be an integer/);
    assert.throws(() => validate(true), /Value must be an integer/);
  });

  it('should coerce value to integer type', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'number'
    });
    const validate = prm1.validator({coerceTypes: true});
    assert.strictEqual(validate('0'), 0);
    assert.strictEqual(validate('123'), 123);
  });

  it('should coerce default value to number type', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'number',
      default: '0'
    });
    const validate = prm1.validator({coerceTypes: true});
    assert.strictEqual(validate(), 0);
  });

  it('should validate minimum property is an integer', function() {
    assert.throws(() =>
        library.createType({
          name: 'prm1',
          type: 'integer',
          minimum: 5.5
        }), /minimum property must be an integer/);
  });

  it('should validate maximum property is an integer', function() {
    assert.throws(() =>
        library.createType({
          name: 'prm1',
          type: 'integer',
          maximum: 5.5
        }), /maximum property must be an integer/);
  });

  it('should validate maximum property is an integer', function() {
    assert.throws(() =>
        library.createType({
          name: 'prm1',
          type: 'integer',
          multipleOf: 5.5
        }), /multipleOf property must be an integer/);
  });

  it('should validate minimum', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'integer',
      minimum: 5
    });
    const validate = prm1.validator();
    validate(5);
    assert.throws(() => validate(4),
        /Minimum accepted value is 5, actual 4/);
  });

  it('should validate minimum limit', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'integer'
    });
    const validate = prm1.validator();
    assert.throws(() => validate(-9007199254740992),
        /Minimum accepted value is/);
  });

  it('should validate maximum', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'integer',
      maximum: 5
    });
    const validate = prm1.validator();
    validate(5);
    assert.throws(() => validate(6),
        /Maximum accepted value is 5, actual 6/);
  });

  it('should validate maximum limit', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'integer'
    });
    const validate = prm1.validator();
    assert.throws(() => validate(9007199254740992),
        /Maximum accepted value is/);
  });

  it('should validate multipleOf', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'integer',
      multipleOf: 10
    });
    const validate = prm1.validator();
    validate(10);
    assert.throws(() => validate(11),
        / Numeric value must be multiple of/);
  });

});
