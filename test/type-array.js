/* eslint-disable */
const assert = require('assert');
const {Library} = require('../lib/schema/Library');

describe('ArrayType', function() {

  let library;

  beforeEach(function() {
    library = new Library();
  });

  describe('validation', function() {

    it('should check required', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'array',
        required: true
      });

      const validate = typ1.validator();
      assert.throws(() => validate(), /Value required/);
      assert.throws(() => validate(null), /Value required/);
    });

    it('should not check required if default value assigned', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'array',
        required: true,
        default: [1, 2, 3]
      });

      const validate = typ1.validator();
      validate();
      validate(null);
    });

    it('should validate', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'array'
      });
      const validate = typ1.validator();
      validate([0, 1, '2', 3.3]);
      validate();
      validate(null);
      validate({});
      validate(1);
      validate('0');
    });

    it('should throw error for non-array values in strict mode', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'array'
      });
      const validate = typ1.validator({strictTypes: true});
      assert.throws(() => validate({}), /Value must be an array/);
      assert.throws(() => validate(1), /Value must be an array/);
      assert.throws(() => validate('0'), /Value must be an array/);
    });

    it('should validate items', function() {
      let typ1 = library.createType({
        name: 'typ1',
        type: 'array',
        items: ['string']
      });
      const validate = typ1.validator({strictTypes: true});
      validate(['1', '2']);
      assert.throws(() => validate([1, 2]));
    });

    it('should check minProperties', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'array',
        minItems: 10
      });
      const validate = typ1.validator();
      assert.throws(() => validate([1, 2, 3]),
          /Minimum accepted array length is 10/);
    });

    it('should check maxProperties', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'array',
        maxItems: 2
      });
      const validate = typ1.validator();
      assert.throws(() => validate([1, 2, 3]),
          /Maximum accepted array length is 2/);
    });

  });

  describe('coercion', function() {

    it('should coerce to JSON type', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'array'
      });
      const validate = typ1.validator({coerceTypes: true});
      assert.deepStrictEqual(validate([0, 1, '2', 'abc', 3.3]),
          [0, 1, '2', 'abc', 3.3]);
      assert.strictEqual(validate(), null);
      assert.strictEqual(validate(null), null);
      assert.deepStrictEqual(validate({}), [{}]);
      assert.deepStrictEqual(validate(1), [1]);
      assert.deepStrictEqual(validate('0'), ['0']);
    });

    it('should coerce array and items to JSON type', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'array',
        items: ['integer', 'string']
      });
      const validate = typ1.validator({coerceTypes: true});
      assert.deepStrictEqual(validate([0, '2', true, 3.3]),
          [0, '2', 1, '3.3']);
      assert.strictEqual(validate(), null);
      assert.strictEqual(validate(null), null);
      assert.deepStrictEqual(validate(1), [1]);
      assert.deepStrictEqual(validate('0'), ['0']);
    });

    it('should coerce default value to JSON type', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'array',
        default: [1, 2, 3]
      });
      const validate = typ1.validator({coerceTypes: true});
      assert.deepStrictEqual(validate(), [1, 2, 3]);
    });

  });

});
