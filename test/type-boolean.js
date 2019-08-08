/* eslint-disable */
const assert = require('assert');
const {Library} = require('../lib/schema/Library');

describe('BooleanType', function() {

  let library;

  beforeEach(function() {
    library = new Library();
  });

  describe('validation', function() {

    it('should check required', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'boolean',
        required: true
      });

      const validate = prm1.validator();
      assert.throws(() => validate(), /Value required/);
      assert.throws(() => validate(null), /Value required/);
    });

    it('should not check required if default value assigned', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'boolean',
        required: true,
        default: true
      });

      const validate = prm1.validator();
      validate();
      validate(null);
    });

    it('should validate boolean values', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'boolean'
      });
      const validate = prm1.validator();
      validate(false);
      validate(true);
    });

    it('should validate non-boolean primitive values (no strict)', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'boolean'
      });
      const validate = prm1.validator();
      validate(0);
      validate('');
      validate();
      validate(null);
      assert.throws(() => validate([]), /Value must be a boolean/);
      assert.throws(() => validate({}), /Value must be a boolean/);
    });

    it('should throw error for non-boolean values in strict mode', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'boolean'
      });
      const validate = prm1.validator({strictTypes: true});
      validate(false);
      validate(true);
      validate(null);
      assert.throws(() => validate(0), /Value must be a boolean/);
      assert.throws(() => validate(''), /Value must be a boolean/);
    });

  });

  describe('coercion', function() {

    it('should coerce value to JSON type', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'boolean'
      });
      const validate = prm1.validator({coerceTypes: true});
      assert.strictEqual(validate(false), false);
      assert.strictEqual(validate(true), true);
      assert.strictEqual(validate(0), false);
      assert.strictEqual(validate(''), false);
      assert.strictEqual(validate(1), true);
      assert.strictEqual(validate('0'), true);
    });

    it('should coerce default value to JSON type', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'boolean',
        default: 1
      });
      const validate = prm1.validator({coerceTypes: true});
      assert.strictEqual(validate(), true);
    });

    it('should coerce value to JS type', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'boolean'
      });
      const validate = prm1.validator({coerceJSTypes: true});
      assert.strictEqual(validate(false), false);
      assert.strictEqual(validate(true), true);
      assert.strictEqual(validate(0), false);
      assert.strictEqual(validate(''), false);
      assert.strictEqual(validate(1), true);
      assert.strictEqual(validate('0'), true);
    });

    it('should coerce default value to JS type', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'boolean',
        default: 1
      });
      const validate = prm1.validator({coerceJSTypes: true});
      assert.strictEqual(validate(), true);
    });

  });

});
