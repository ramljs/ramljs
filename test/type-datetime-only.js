/* eslint-disable */
const assert = require('assert');
const TypeLibrary = require('../lib/types/TypeLibrary');

describe('DateTimeOnlyType', function() {

  const library = new TypeLibrary();

  it('should apply type check', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'datetime-only'
    });
    const validate = prm1.validator({throwOnError: true});
    assert.deepStrictEqual(validate('2011-01-02'), {
      valid: true,
      value: '2011-01-02'
    });
    assert.deepStrictEqual(validate('2011-01-02T10:30'), {
      valid: true,
      value: '2011-01-02T10:30'
    });
    assert.deepStrictEqual(validate('2011-01-02T10:30:15'), {
      valid: true,
      value: '2011-01-02T10:30:15'
    });
    assert.deepStrictEqual(validate('2011-01-02T10:30:15.123'), {
      valid: true,
      value: '2011-01-02T10:30:15.123'
    });
    const d1 = new Date();
    assert.deepStrictEqual(validate(d1), {valid: true, value: d1});
    assert.throws(() => validate(0), /Value must be a datetime-only formatted string or Date instance/);
    assert.throws(() => validate(''), /Value must be a datetime-only formatted string or Date instance/);
    assert.throws(() => validate({}), /Value must be a datetime-only formatted string or Date instance/);
    assert.throws(() => validate('2011-02-30T10:30:15Z'), /Value must be a datetime-only formatted string or Date instance/);
    assert.throws(() => validate('2011-01-02T10:30:15.123Z'), /Value must be a datetime-only formatted string or Date instance/);
    assert.throws(() => validate('2011-01-02T10:30:15.123+03:00\''), /Value must be a datetime-only formatted string or Date instance/);
    assert.throws(() => validate('2011-01-02T10:30:15Z'), /Value must be a datetime-only formatted string or Date instance/);
  });

  it('should apply type check in fast mode', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'datetime-only'
    });
    const validate = prm1.validator({
      fastDateValidation: true,
      throwOnError: true
    });
    assert.deepStrictEqual(validate('2011-01-02'), {
      valid: true,
      value: '2011-01-02'
    });
    assert.deepStrictEqual(validate('2011-01-02T10:30'), {
      valid: true,
      value: '2011-01-02T10:30'
    });
    assert.deepStrictEqual(validate('2011-01-02T10:30:15'), {
      valid: true,
      value: '2011-01-02T10:30:15'
    });
    assert.deepStrictEqual(validate('2011-01-02T10:30:15.123'), {
      valid: true,
      value: '2011-01-02T10:30:15.123'
    });
    const d1 = new Date();
    assert.deepStrictEqual(validate(d1), {valid: true, value: d1});
    assert.throws(() => validate(0), /Value must be a datetime-only formatted string or Date instance/);
    assert.throws(() => validate(''), /Value must be a datetime-only formatted string or Date instance/);
    assert.throws(() => validate({}), /Value must be a datetime-only formatted string or Date instance/);
    assert.throws(() => validate('2011-02-30T10:30:15Z'), /Value must be a datetime-only formatted string or Date instance/);
    assert.throws(() => validate('2011-01-02T10:30:15.123Z'), /Value must be a datetime-only formatted string or Date instance/);
    assert.throws(() => validate('2011-01-02T10:30:15.123+03:00\''), /Value must be a datetime-only formatted string or Date instance/);
    assert.throws(() => validate('2011-01-02T10:30:15Z'), /Value must be a datetime-only formatted string or Date instance/);
  });

  it('should coerce value to datetime-only type', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'datetime-only'
    });
    const validate = prm1.validator({coerceTypes: true});
    assert.deepStrictEqual(validate('2011-01-02T10:30:15.123'), {
      valid: true,
      value: '2011-01-02T10:30:15.123'
    });
    assert.deepStrictEqual(validate('2011-01-02T10:30:15'), {
      valid: true,
      value: '2011-01-02T10:30:15'
    });
    assert.deepStrictEqual(validate('2011-01-02T10:30'), {
      valid: true,
      value: '2011-01-02T10:30:00'
    });
    assert.deepStrictEqual(validate('2011-01-02'), {
      valid: true,
      value: '2011-01-02T00:00:00'
    });
  });

  it('should coerce value to datetime-only type in fast mode', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'datetime-only'
    });
    const validate = prm1.validator({
      coerceTypes: true,
      fastDateValidation: true
    });
    assert.deepStrictEqual(validate('2011-01-02T10:30:15.123'), {
      valid: true,
      value: '2011-01-02T10:30:15.123'
    });
    assert.deepStrictEqual(validate('2011-01-02T10:30:15'), {
      valid: true,
      value: '2011-01-02T10:30:15'
    });
    assert.deepStrictEqual(validate('2011-01-02T10:30'), {
      valid: true,
      value: '2011-01-02T10:30:00'
    });
    assert.deepStrictEqual(validate('2011-01-02'), {
      valid: true,
      value: '2011-01-02T00:00:00'
    });
  });

  it('should coerce default value to datetime-only type', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'datetime-only',
      default: '2011-01-02'
    });
    const validate = prm1.validator({coerceTypes: true});
    assert.deepStrictEqual(validate(), {
      valid: true,
      value: '2011-01-02T00:00:00'
    });
  });

  it('should coerce value to Date instance if coerceJSTypes=true', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'datetime-only'
    });
    const validate = prm1.validator({coerceJSTypes: true});
    assert.deepStrictEqual(validate('2011-01-02T10:30:15.123'),
        {valid: true, value: new Date('2011-01-02T10:30:15.123Z')});
    assert.deepStrictEqual(validate('2011-01-02T10:30:15'),
        {valid: true, value: new Date('2011-01-02T10:30:15.000Z')});
    assert.deepStrictEqual(validate('2011-01-02T10:30'),
        {valid: true, value: new Date('2011-01-02T10:30:00.000Z')});
    assert.deepStrictEqual(validate('2011-01-02'),
        {valid: true, value: new Date('2011-01-02T00:00:00.000Z')});
  });

  it('should coerce default value to Date instance if coerceJSTypes=true', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'datetime-only',
      default: '2011-01-02'
    });
    const validate = prm1.validator({coerceJSTypes: true});
    assert.deepStrictEqual(validate(), {
      valid: true,
      value: new Date('2011-01-02T00:00:00.000Z')
    });
  });

});
