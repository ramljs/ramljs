/* eslint-disable */
const assert = require('assert');
const {TypeLibrary} = require('../lib/types/TypeLibrary');

describe('DateTimeOnlyType', function() {

  const library = new TypeLibrary();

  it('should validate compatible values', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'datetime-only'
    });
    const validate = prm1.validator();
    assert.strictEqual(validate('2011-01-02'), '2011-01-02');
    assert.strictEqual(validate('2011-01-02T10:30'), '2011-01-02T10:30');
    assert.strictEqual(validate('2011-01-02T10:30:15'), '2011-01-02T10:30:15');
    assert.strictEqual(validate('2011-01-02T10:30:15.123'), '2011-01-02T10:30:15.123');
    const d1 = new Date();
    assert.strictEqual(validate(d1), d1);
    assert.throws(() => validate(0), /Value must be a datetime-only formatted string or Date instance/);
    assert.throws(() => validate(''), /Value must be a datetime-only formatted string or Date instance/);
    assert.throws(() => validate({}), /Value must be a datetime-only formatted string or Date instance/);
    assert.throws(() => validate('2011-02-30T10:30:15Z'), /Value must be a datetime-only formatted string or Date instance/);
    assert.throws(() => validate('2011-01-02T10:30:15.123Z'), /Value must be a datetime-only formatted string or Date instance/);
    assert.throws(() => validate('2011-01-02T10:30:15.123+03:00\''), /Value must be a datetime-only formatted string or Date instance/);
    assert.throws(() => validate('2011-01-02T10:30:15Z'), /Value must be a datetime-only formatted string or Date instance/);
  });

  it('should validate compatible values in fast mode', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'datetime-only'
    });
    const validate = prm1.validator({fastDateValidation: true});
    assert.strictEqual(validate('2011-01-02'), '2011-01-02');
    assert.strictEqual(validate('2011-01-02T10:30'), '2011-01-02T10:30');
    assert.strictEqual(validate('2011-01-02T10:30:15'), '2011-01-02T10:30:15');
    assert.strictEqual(validate('2011-01-02T10:30:15.123'), '2011-01-02T10:30:15.123');
    const d1 = new Date();
    assert.strictEqual(validate(d1), d1);
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
    assert.strictEqual(validate('2011-01-02T10:30:15.123'), '2011-01-02T10:30:15.123');
    assert.strictEqual(validate('2011-01-02T10:30:15'), '2011-01-02T10:30:15');
    assert.strictEqual(validate('2011-01-02T10:30'), '2011-01-02T10:30:00');
    assert.strictEqual(validate('2011-01-02'), '2011-01-02T00:00:00');
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
    assert.strictEqual(validate('2011-01-02T10:30:15.123'), '2011-01-02T10:30:15.123');
    assert.strictEqual(validate('2011-01-02T10:30:15'), '2011-01-02T10:30:15');
    assert.strictEqual(validate('2011-01-02T10:30'), '2011-01-02T10:30:00');
    assert.strictEqual(validate('2011-01-02'), '2011-01-02T00:00:00');
  });

  it('should coerce default value to datetime-only type', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'datetime-only',
      default: '2011-01-02'
    });
    const validate = prm1.validator({coerceTypes: true});
    assert.strictEqual(validate(), '2011-01-02T00:00:00');
  });

  it('should coerce value to Date instance if coerceJSTypes=true', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'datetime-only'
    });
    const validate = prm1.validator({coerceJSTypes: true});
    assert.strictEqual(validate('2011-01-02T10:30:15.123')
        .toISOString(), '2011-01-02T10:30:15.123Z');
    assert.strictEqual(validate('2011-01-02T10:30:15')
        .toISOString(), '2011-01-02T10:30:15.000Z');
    assert.strictEqual(validate('2011-01-02T10:30')
        .toISOString(), '2011-01-02T10:30:00.000Z');
    assert.strictEqual(validate('2011-01-02')
        .toISOString(), '2011-01-02T00:00:00.000Z');
  });

  it('should coerce default value to Date instance if coerceJSTypes=true', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'datetime-only',
      default: '2011-01-02'
    });
    const validate = prm1.validator({coerceJSTypes: true});
    assert.strictEqual(validate().toISOString(), '2011-01-02T00:00:00.000Z');
  });

});
