/* eslint-disable */
const assert = require('assert');
const {Library} = require('../lib/schema/Library');

describe('DateTimeOnlyType', function() {

  let library;

  beforeEach(function() {
    library = new Library();
  });

  describe('validation', function() {

    it('should check required', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'datetime-only',
        required: true
      });

      const validate = prm1.validator();
      assert.throws(() => validate(), /Value required/);
      assert.throws(() => validate(null), /Value required/);
    });

    it('should not check required if default value assigned', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'datetime-only',
        required: true,
        default: '2011-01-02'
      });

      const validate = prm1.validator();
      validate();
      validate(null);
    });

    it('should validate string and Date values', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'datetime-only'
      });
      const validate = prm1.validator();
      validate('2011-01-02');
      validate('2011-01-02T10:30');
      validate('2011-01-02T10:30:15');
      validate('2011-01-02T10:30:15.123');
      validate('2011-01-02T10:30:15.123+03:00');
      validate('2011-01-02T10:30:15.123Z');
      validate('2011-01-02T10:30:15Z');
      validate(new Date());
      assert.throws(() => validate(0), /Value must be a datetime-only formatted string or Date instance/);
      assert.throws(() => validate(''), /Value must be a datetime-only formatted string or Date instance/);
      assert.throws(() => validate({}), /Value must be a datetime-only formatted string or Date instance/);
      assert.throws(() => validate('2011-02-30T10:30:15Z'), /Value must be a datetime-only formatted string or Date instance/);
    });

    it('should validate string and Date values in fast mode', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'datetime-only'
      });
      const validate = prm1.validator({fastDateValidation: true});
      validate('2011-01-02');
      validate('2011-01-02T10:30');
      validate('2011-01-02T10:30:15');
      validate('2011-01-02T10:30:15.123');
      validate('2011-01-02T10:30:15.123+03:00');
      validate('2011-01-02T10:30:15.123Z');
      validate('2011-01-02T10:30:15Z');
      validate(new Date());
      assert.throws(() => validate(0), /Value must be a datetime-only formatted string or Date instance/);
      assert.throws(() => validate(''), /Value must be a datetime-only formatted string or Date instance/);
      assert.throws(() => validate({}), /Value must be a datetime-only formatted string or Date instance/);
      assert.throws(() => validate('2011-02-30T10:30:15Z'), /Value must be a datetime-only formatted string or Date instance/);
    });

  });

  describe('coercion', function() {

    it('should coerce value to JSON type', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'datetime-only'
      });
      const validate = prm1.validator({coerceTypes: true});
      assert.strictEqual(validate('2011-01-02T10:30:15.123Z'), '2011-01-02T10:30:15.123');
      assert.strictEqual(validate('2011-01-02T10:30:15.123+03:00'), '2011-01-02T07:30:15.123');
      assert.strictEqual(validate('2011-01-02T10:30:15.123'), '2011-01-02T10:30:15.123');
      assert.strictEqual(validate('2011-01-02T10:30:15'), '2011-01-02T10:30:15');
      assert.strictEqual(validate('2011-01-02T10:30'), '2011-01-02T10:30:00');
      assert.strictEqual(validate('2011-01-02'), '2011-01-02T00:00:00');
    });

    it('should coerce value to JSON type in fast mode', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'datetime-only'
      });
      const validate = prm1.validator({
        coerceTypes: true,
        fastDateValidation: true
      });
      assert.strictEqual(validate('2011-01-02T10:30:15.123Z'), '2011-01-02T10:30:15.123');
      assert.strictEqual(validate('2011-01-02T10:30:15.123+03:00'), '2011-01-02T07:30:15.123');
      assert.strictEqual(validate('2011-01-02T10:30:15.123'), '2011-01-02T10:30:15.123');
      assert.strictEqual(validate('2011-01-02T10:30:15'), '2011-01-02T10:30:15');
      assert.strictEqual(validate('2011-01-02T10:30'), '2011-01-02T10:30:00');
      assert.strictEqual(validate('2011-01-02'), '2011-01-02T00:00:00');
    });

    it('should coerce default value to JSON type', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'datetime-only',
        default: '2011-01-02'
      });
      const validate = prm1.validator({coerceTypes: true});
      assert.strictEqual(validate(), '2011-01-02T00:00:00');
    });

    it('should coerce value to JS type', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'datetime-only'
      });
      const validate = prm1.validator({coerceJSTypes: true});
      assert.strictEqual(validate('2011-01-02T10:30:15.123Z')
          .toISOString(), '2011-01-02T10:30:15.123Z');
      assert.strictEqual(validate('2011-01-02T10:30:15.123+01:00')
          .toISOString(), '2011-01-02T09:30:15.123Z');
      assert.strictEqual(validate('2011-01-02T10:30:15.123')
          .toISOString(), '2011-01-02T10:30:15.123Z');
      assert.strictEqual(validate('2011-01-02T10:30:15')
          .toISOString(), '2011-01-02T10:30:15.000Z');
      assert.strictEqual(validate('2011-01-02T10:30')
          .toISOString(), '2011-01-02T10:30:00.000Z');
      assert.strictEqual(validate('2011-01-02')
          .toISOString(), '2011-01-02T00:00:00.000Z');
    });

    it('should coerce default value to JS type', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'datetime-only',
        default: '2011-01-02'
      });
      const validate = prm1.validator({coerceJSTypes: true});
      assert.strictEqual(validate().toISOString(), '2011-01-02T00:00:00.000Z');
    });

  });

});
