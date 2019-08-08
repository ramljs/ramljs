/* eslint-disable */
const assert = require('assert');
const {Library} = require('../lib/schema/Library');

describe('TimeOnlyType', function() {

  let library;

  beforeEach(function() {
    library = new Library();
  });

  describe('validation', function() {

    it('should check required', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'time-only',
        required: true
      });

      const validate = prm1.validator();
      assert.throws(() => validate(), /Value required/);
      assert.throws(() => validate(null), /Value required/);
    });

    it('should not check required if default value assigned', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'time-only',
        required: true,
        default: '10:11:12'
      });

      const validate = prm1.validator();
      validate();
      validate(null);
    });

    it('should validate string and Date values', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'time-only'
      });
      const validate = prm1.validator();
      validate('10:11:12');
      validate(new Date());
      assert.throws(() => validate('2011-01-02T10:11:12'), /Value must be a time-only formatted string or Date instance/);
      assert.throws(() => validate(0), /Value must be a time-only formatted string or Date instance/);
      assert.throws(() => validate(''), /Value must be a time-only formatted string or Date instance/);
      assert.throws(() => validate({}), /Value must be a time-only formatted string or Date instance/);
      assert.throws(() => validate('2011-02-30T10:30:15Z'), /Value must be a time-only formatted string or Date instance/);
    });

    it('should validate string and Date values in fast mode', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'time-only'
      });
      const validate = prm1.validator({fastDateValidation: true});
      validate('10:11:12');
      validate(new Date());
      assert.throws(() => validate('2011-01-02T10:30'), /Value must be a time-only formatted string or Date instance/);
      assert.throws(() => validate(0), /Value must be a time-only formatted string or Date instance/);
      assert.throws(() => validate(''), /Value must be a time-only formatted string or Date instance/);
      assert.throws(() => validate({}), /Value must be a time-only formatted string or Date instance/);
      assert.throws(() => validate('2011-02-30T10:30:15Z'), /Value must be a time-only formatted string or Date instance/);
    });

  });

  describe('coercion', function() {

    it('should coerce value to JSON type', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'time-only'
      });
      const validate = prm1.validator({coerceTypes: true});
      assert.strictEqual(validate('10:11'), '10:11:00');
      assert.strictEqual(validate('10:11:12.123'), '10:11:12.123');
      assert.strictEqual(validate(new Date('2011-01-02T10:30:15.123Z')), '10:30:15.123');
    });

    it('should coerce value to JSON type in fast mode', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'time-only'
      });
      const validate = prm1.validator({
        coerceTypes: true,
        fastDateValidation: true
      });
      assert.strictEqual(validate('10:11'), '10:11:00');
      assert.strictEqual(validate('10:11:12.123'), '10:11:12.123');
      assert.strictEqual(validate(new Date('2011-01-02T10:30:15.123Z')), '10:30:15.123');
    });

    it('should coerce default value to JSON type', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'time-only',
        default: '10:11:12.123'
      });
      const validate = prm1.validator({coerceTypes: true});
      assert.strictEqual(validate(), '10:11:12.123');
    });

    it('should coerce value to JS type', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'time-only'
      });
      const validate = prm1.validator({coerceJSTypes: true});
      assert.strictEqual(validate('10:11:12.123')
          .toISOString(), '1970-01-01T10:11:12.123Z');
    });

    it('should coerce default value to JS type', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'time-only',
        default: '10:11:12.123'
      });
      const validate = prm1.validator({coerceJSTypes: true});
      assert.strictEqual(validate().toISOString(), '1970-01-01T10:11:12.123Z');
    });

  });

});
