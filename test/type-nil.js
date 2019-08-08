/* eslint-disable */
const assert = require('assert');
const {Library} = require('../lib/schema/Library');

describe('NilType', function() {

  let library;

  beforeEach(function() {
    library = new Library();
  });

  describe('validation', function() {

    it('should not check required', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'nil',
        required: true
      });

      const validate = prm1.validator();
      validate();
      validate(null);
    });

    it('should validate null value', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'nil'
      });
      const validate = prm1.validator();
      validate(null);
      validate();
    });

    it('should throw error for non-null values in strict mode', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'nil'
      });
      const validate = prm1.validator({strictTypes: true});
      assert.throws(() => validate(0), /Value must be null/);
      assert.throws(() => validate(''), /Value must be null/);
      assert.throws(() => validate({}), /Value must be null/);
    });

  });

  describe('coercion', function() {

    it('should coerce value to JSON type', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'nil'
      });
      const validate = prm1.validator({coerceTypes: true});
      assert.strictEqual(validate(), null);
    });

    it('should coerce value to JS type', function() {
      const prm1 = library.createType({
        name: 'prm1',
        type: 'nil'
      });
      const validate = prm1.validator({coerceJSTypes: true});
      assert.strictEqual(validate(), null);

    });

  });

});
