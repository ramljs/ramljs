/* eslint-disable */
const assert = require('assert');
const {TypeLibrary} = require('../lib/types/TypeLibrary');

describe('TimeOnlyType', function() {

  const library = new TypeLibrary();

  it('should apply type check', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'time-only'
    });
    const validate = prm1.validator({throwOnError: true});
    assert.deepStrictEqual(validate('10:30'), {valid: true, value: '10:30'});
    assert.deepStrictEqual(validate('10:30:11'), {
      valid: true,
      value: '10:30:11'
    });
    assert.deepStrictEqual(validate('10:30:11.123'), {
      valid: true,
      value: '10:30:11.123'
    });
    const d1 = new Date();
    assert.deepStrictEqual(validate(d1), {valid: true, value: d1});
    assert.throws(() => validate(0), /Value must be a time-only formatted string or Date instance/);
    assert.throws(() => validate(''), /Value must be a time-only formatted string or Date instance/);
    assert.throws(() => validate({}), /Value must be a time-only formatted string or Date instance/);
    assert.throws(() => validate('2011-01-02T10:30'), /Value must be a time-only formatted string or Date instance/);
  });

  it('should apply type check in fast mode', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'time-only'
    });
    const validate = prm1.validator({
      fastDateValidation: true,
      throwOnError: true
    });
    assert.deepStrictEqual(validate('10:30'), {valid: true, value: '10:30'});
    assert.deepStrictEqual(validate('10:30:11'), {
      valid: true,
      value: '10:30:11'
    });
    assert.deepStrictEqual(validate('10:30:11.123'), {
      valid: true,
      value: '10:30:11.123'
    });
    const d1 = new Date();
    assert.deepStrictEqual(validate(d1), {valid: true, value: d1});
    assert.throws(() => validate(0), /Value must be a time-only formatted string or Date instance/);
    assert.throws(() => validate(''), /Value must be a time-only formatted string or Date instance/);
    assert.throws(() => validate({}), /Value must be a time-only formatted string or Date instance/);
    assert.throws(() => validate('2011-01-02T10:30'), /Value must be a time-only formatted string or Date instance/);
  });

  it('should coerce value to time-only type', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'time-only'
    });
    const validate = prm1.validator({coerceTypes: true});
    assert.deepStrictEqual(validate('10:30'), {valid: true, value: '10:30:00'});
    assert.deepStrictEqual(validate('10:30:11'), {
      valid: true,
      value: '10:30:11'
    });
    assert.deepStrictEqual(validate('10:30.123'), {
      valid: true,
      value: '10:30:00.123'
    });
  });

  it('should coerce value to time-only type in fast mode', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'time-only'
    });
    const validate = prm1.validator({
      coerceTypes: true,
      fastDateValidation: true
    });
    assert.deepStrictEqual(validate('10:30'), {valid: true, value: '10:30:00'});
    assert.deepStrictEqual(validate('10:30:11'), {
      valid: true,
      value: '10:30:11'
    });
    assert.deepStrictEqual(validate('10:30.123'), {
      valid: true,
      value: '10:30:00.123'
    });
  });

  it('should coerce default value to time-only type', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'time-only',
      default: '10:30:00.123'
    });
    const validate = prm1.validator({coerceTypes: true});
    assert.deepStrictEqual(validate(), {valid: true, value: '10:30:00.123'});
    assert.deepStrictEqual(validate(null), {
      valid: true,
      value: '10:30:00.123'
    });
  });

  it('should coerce value to Date instance if coerceJSTypes=true', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'time-only'
    });
    const validate = prm1.validator({coerceJSTypes: true});
    assert.deepStrictEqual(validate('10:30'),
        {valid: true, value: new Date('1970-01-01T10:30:00.000Z')});
    assert.deepStrictEqual(validate('10:30:11'),
        {valid: true, value: new Date('1970-01-01T10:30:11.000Z')});
    assert.deepStrictEqual(validate('10:30:11.123'),
        {valid: true, value: new Date('1970-01-01T10:30:11.123Z')});
  });

  it('should coerce default value to Date instance if coerceJSTypes=true', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'time-only',
      default: '10:30:11.123'
    });
    const validate = prm1.validator({coerceJSTypes: true});
    assert.deepStrictEqual(validate(), {
      valid: true,
      value: new Date('1970-01-01T10:30:11.123Z')
    });
  });

});
