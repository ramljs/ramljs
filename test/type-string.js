/* eslint-disable */
const assert = require('assert');
const {Library} = require('../lib/schema/Library');

describe('StringType', function() {

  let library;

  beforeEach(function() {
    library = new Library();
  });

  describe('validation', function() {

    it('should check required', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'string',
        required: true
      });

      const validate = prm1.validator();
      assert.throws(() => validate(), /Value required/);
      assert.throws(() => validate(null), /Value required/);
    });

    it('should not check required if default value assigned', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'string',
        required: true,
        default: 'abc'
      });

      const validate = prm1.validator();
      validate();
      validate(null);
    });

    it('should validate string values', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'string'
      });
      const validate = prm1.validator();
      validate('');
      validate('abcd');
    });

    it('should validate non-string primitive values (no strict)', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'string'
      });
      const validate = prm1.validator();
      validate(0);
      validate('');
      validate();
      validate(null);
      assert.throws(() => validate([]), /Value must be a string/);
      assert.throws(() => validate({}), /Value must be a string/);
    });

    it('should throw error for non-string values in strict mode', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'string'
      });
      const validate = prm1.validator({strictTypes: true});
      validate('');
      validate('abc');
      assert.throws(() => validate(0), /Value must be a string/);
    });

    it('should validate min length', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'string',
        minLength: 5
      });
      const validate = prm1.validator();
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
      const validate = prm1.validator();
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
      const validate = prm1.validator();
      validate(1234);
      validate('ab');
      assert.throws(() => validate('xyz'),
          /Value does not match required format/);
    });

  });

  describe('coercion', function() {
    it('should coerce value to JSON type', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'string'
      });
      const validate = prm1.validator({coerceTypes: true});
      assert.strictEqual(validate(false), 'false');
      assert.strictEqual(validate(true), 'true');
      assert.strictEqual(validate(0), '0');
      assert.strictEqual(validate(1.23), '1.23');
    });

    it('should coerce default value to JSON type', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'string',
        default: 1
      });
      const validate = prm1.validator({coerceTypes: true});
      assert.strictEqual(validate(), '1');
    });

    it('should coerce value to JS type', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'string'
      });
      const validate = prm1.validator({coerceJSTypes: true});
      assert.strictEqual(validate(false), 'false');
      assert.strictEqual(validate(true), 'true');
      assert.strictEqual(validate(0), '0');
      assert.strictEqual(validate(''), '');
      assert.strictEqual(validate(1), '1');
    });

    it('should coerce default value to JS type', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'string',
        default: 1
      });
      const validate = prm1.validator({coerceJSTypes: true});
      assert.strictEqual(validate(), '1');
    });

  });

});
