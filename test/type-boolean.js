/* eslint-disable */
const assert = require('assert');
const {TypeLibrary} = require('../lib/types/TypeLibrary');

describe('BooleanType', function() {

  const library = new TypeLibrary();

  it('should apply type check', function() {
    const typ1 = library.createType({
      name: 'typ1',
      type: 'boolean'
    });
    const validate = typ1.validator({throwOnError: true});
    assert.deepStrictEqual(validate(null), {valid: true, value: null});
    assert.deepStrictEqual(validate(false), {valid: true, value: false});
    assert.deepStrictEqual(validate(true), {valid: true, value: true});
    assert.deepStrictEqual(validate(0), {valid: true, value: 0});
    assert.deepStrictEqual(validate(1), {valid: true, value: 1});
    assert.deepStrictEqual(validate('false'), {valid: true, value: 'false'});
    assert.deepStrictEqual(validate('true'), {valid: true, value: 'true'});
    assert.throws(() => validate(12), /Value must be a boolean/);
    assert.throws(() => validate(''), /Value must be a boolean/);
    assert.throws(() => validate([]), /Value must be a boolean/);
    assert.throws(() => validate({}), /Value must be a boolean/);
  });

  it('should throw error for non-boolean values in strict mode', function() {
    const typ1 = library.createType({
      name: 'typ1',
      type: 'boolean'
    });
    const validate = typ1.validator({strictTypes: true, throwOnError: true});
    validate(false);
    validate(true);
    validate(null);
    assert.throws(() => validate(0), /Value must be a boolean/);
    assert.throws(() => validate(1), /Value must be a boolean/);
    assert.throws(() => validate('false'), /Value must be a boolean/);
    assert.throws(() => validate('true'), /Value must be a boolean/);
    assert.throws(() => validate(''), /Value must be a boolean/);
  });

  it('should coerce value to boolean type', function() {
    const typ1 = library.createType({
      name: 'typ1',
      type: 'boolean'
    });
    const validate = typ1.validator({coerceTypes: true});
    assert.deepStrictEqual(validate(false), {valid: true, value: false});
    assert.deepStrictEqual(validate(true), {valid: true, value: true});
    assert.deepStrictEqual(validate(0), {valid: true, value: false});
    assert.deepStrictEqual(validate(1), {valid: true, value: true});
    assert.deepStrictEqual(validate('false'), {valid: true, value: false});
    assert.deepStrictEqual(validate('true'), {valid: true, value: true});
  });

  it('should coerce default value to boolean type', function() {
    const typ1 = library.createType({
      name: 'typ1',
      type: 'boolean',
      default: 1
    });
    const validate = typ1.validator({coerceTypes: true});
    assert.deepStrictEqual(validate(), {valid: true, value: true});
  });

});
