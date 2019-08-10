/* eslint-disable */
const assert = require('assert');
const {TypeLibrary} = require('../lib/types/TypeLibrary');

describe('TimeOnlyType', function() {

  const library = new TypeLibrary();

  it('should validate compatible values', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'time-only'
    });
    const validate = prm1.validator();
    assert.strictEqual(validate('10:30'), '10:30');
    assert.strictEqual(validate('10:30:11'), '10:30:11');
    assert.strictEqual(validate('10:30:11.123'), '10:30:11.123');
    const d1 = new Date();
    assert.strictEqual(validate(d1), d1);
    assert.throws(() => validate(0), /Value must be a time-only formatted string or Date instance/);
    assert.throws(() => validate(''), /Value must be a time-only formatted string or Date instance/);
    assert.throws(() => validate({}), /Value must be a time-only formatted string or Date instance/);
    assert.throws(() => validate('2011-01-02T10:30'), /Value must be a time-only formatted string or Date instance/);
  });

  it('should validate compatible values in fast mode', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'time-only'
    });
    const validate = prm1.validator({fastDateValidation: true});
    assert.strictEqual(validate('10:30'), '10:30');
    assert.strictEqual(validate('10:30:11'), '10:30:11');
    assert.strictEqual(validate('10:30:11.123'), '10:30:11.123');
    const d1 = new Date();
    assert.strictEqual(validate(d1), d1);
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
    assert.strictEqual(validate('10:30'), '10:30:00');
    assert.strictEqual(validate('10:30:11'), '10:30:11');
    assert.strictEqual(validate('10:30.123'), '10:30:00.123');
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
    assert.strictEqual(validate('10:30'), '10:30:00');
    assert.strictEqual(validate('10:30:11'), '10:30:11');
    assert.strictEqual(validate('10:30.123'), '10:30:00.123');
  });

  it('should coerce default value to time-only type', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'time-only',
      default: '10:30:00.123'
    });
    const validate = prm1.validator({coerceTypes: true});
    assert.strictEqual(validate(), '10:30:00.123');
    assert.strictEqual(validate(null), '10:30:00.123');
  });

  it('should coerce value to Date instance if coerceJSTypes=true', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'time-only'
    });
    const validate = prm1.validator({coerceJSTypes: true});
    assert.strictEqual(validate('10:30')
        .toISOString(), '1970-01-01T10:30:00.000Z');
    assert.strictEqual(validate('10:30:11')
        .toISOString(), '1970-01-01T10:30:11.000Z');
    assert.strictEqual(validate('10:30:11.123')
        .toISOString(), '1970-01-01T10:30:11.123Z');
  });

  it('should coerce default value to Date instance if coerceJSTypes=true', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'time-only',
      default: '10:30:11.123'
    });
    const validate = prm1.validator({coerceJSTypes: true});
    assert.strictEqual(validate().toISOString(), '1970-01-01T10:30:11.123Z');
  });

});
