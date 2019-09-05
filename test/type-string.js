/* eslint-disable */
const assert = require('assert');
const TypeLibrary = require('../lib/types/TypeLibrary');

describe('StringType', function() {

  const library = new TypeLibrary();

  it('should apply type check', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'string'
    });
    const validate = prm1.validator({throwOnError: true});
    assert.deepStrictEqual(validate(''), {valid: true, value: ''});
    assert.deepStrictEqual(validate(0), {valid: true, value: 0});
    assert.deepStrictEqual(validate(1.1), {valid: true, value: 1.1});
    assert.deepStrictEqual(validate(BigInt(112)), {
      valid: true,
      value: BigInt(112)
    });
    assert.throws(() => validate(false), /Value must be a string/);
    assert.throws(() => validate([]), /Value must be a string/);
    assert.throws(() => validate({}), /Value must be a string/);
  });

  it('should throw error for non-string values in strict mode', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'string'
    });
    const validate = prm1.validator({strictTypes: true, throwOnError: true});
    validate('');
    validate(null);
    assert.throws(() => validate(0), /Value must be a string/);
    assert.throws(() => validate(1.1), /Value must be a string/);
    assert.throws(() => validate(true), /Value must be a string/);
    assert.throws(() => validate(BigInt(112)), /Value must be a string/);
  });

  it('should coerce value to string type', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'string'
    });
    const validate = prm1.validator({coerceTypes: true});
    assert.deepStrictEqual(validate(''), {valid: true, value: ''});
    assert.deepStrictEqual(validate('0'), {valid: true, value: '0'});
    assert.deepStrictEqual(validate(0), {valid: true, value: '0'});
    assert.deepStrictEqual(validate(1.1), {valid: true, value: '1.1'});
    assert.deepStrictEqual(validate(BigInt(123)), {valid: true, value: '123'});
  });

  it('should coerce default value to string type', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'string',
      default: 1
    });
    const validate = prm1.validator({coerceTypes: true});
    assert.deepStrictEqual(validate(), {valid: true, value: '1'});
  });

  it('should allow enum values only if set', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'string',
      enum: ['a', 'b']
    });
    const validate = prm1.validator({throwOnError: true});
    assert.deepStrictEqual(validate('a'), {valid: true, value: 'a'});
    assert.deepStrictEqual(validate('b'), {valid: true, value: 'b'});
    assert.throws(() => validate(''), /Value for "prm1" must be a one of enumerated value/);
    assert.throws(() => validate('c'), /Value for "prm1" must be a one of enumerated value/);
  });

  it('should validate min length', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'string',
      minLength: 5
    });
    const validate = prm1.validator({throwOnError: true});
    validate(12345);
    assert.throws(() => validate('1234'),
        /Minimum accepted length/);
  });

  it('should validate max length', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'string',
      maxLength: 5
    });
    const validate = prm1.validator({throwOnError: true});
    validate(12345);
    assert.throws(() => validate('123456'),
        /Maximum accepted length/);
  });

  it('should validate patterns', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'string',
      pattern: ['[abcd]+', '[1234]']
    });
    const validate = prm1.validator({throwOnError: true});
    validate(1234);
    validate('ab');
    assert.throws(() => validate('xyz'),
        /Value does not match required format/);
  });

});
