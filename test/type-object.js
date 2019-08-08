/* eslint-disable */
const assert = require('assert');
const {Library} = require('../lib/schema/Library');

describe('ObjectType', function() {

  let library;
  const obj1 = {a: 1, b: '2', c: 'c', d: [1, '2', 3.3], e: 1};
  const val1 = {a: '1', b: 2, c: 'c', d: [1, '2', 3.3], e: true};
  const properties1 = {
    a: 'string',
    b: 'number',
    c: 'string',
    d: 'array',
    e: 'boolean'
  };

  beforeEach(function() {
    library = new Library();
  });

  describe('validation', function() {

    it('should check required', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'object',
        required: true
      });

      const validate = typ1.validator();
      assert.throws(() => validate(), /Value required/);
      assert.throws(() => validate(null), /Value required/);
    });

    it('should not check required if default value assigned', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'object',
        required: true,
        default: {}
      });

      const validate = typ1.validator();
      validate();
      validate(null);
    });

    it('should validate object', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'object'
      });
      const validate = typ1.validator();
      validate({});
      validate({a: 1});
    });

    it('should validate object properties', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'object',
        properties: {
          a: 'number'
        }
      });
      const validate = typ1.validator({strictTypes: true});
      validate({a: 1});
      assert.throws(() => validate({a: '1'}), /Value must be a number/);
    });

    it('should throw error for non-object', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'object'
      });
      const validate = typ1.validator();
      assert.throws(() => validate(0), /Value must be an object/);
      assert.throws(() => validate(''), /Value must be an object/);
      assert.throws(() => validate(true), /Value must be an object/);
      assert.throws(() => validate([]), /Value must be an object/);
    });

    it('should allow additional properties if additionalProperties=true', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'object',
        properties: properties1
      });
      const validate = typ1.validator();
      assert(validate({...obj1, f: 'f'}));
    });

    it('should not allow additional properties if additionalProperties=false', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'object',
        properties: properties1,
        additionalProperties: false
      });
      const validate = typ1.validator();
      assert.throws(() =>
              validate({...obj1, f: 'f'}),
          /Object type does not allow additional properties/
      );
    });

    it('should validate minProperties', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'object',
        minProperties: 2
      });
      const validate = typ1.validator();
      assert.throws(() => validate(validate({a: 1})),
          /Minimum accepted properties 2, actual 1/);
    });

    it('should validate maxProperties', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'object',
        maxProperties: 2
      });
      const validate = typ1.validator();
      assert.throws(() => validate(validate({a: 1, b: 2, c: 3})),
          /Maximum accepted properties 2, actual 3/);
    });

    it('should check discriminator', function() {
      library.addType(...[
        {
          name: 'Person',
          type: 'object',
          discriminator: 'kind',
          properties: {
            name: 'string',
            kind: 'string'
          }
        },
        {
          name: 'Employee',
          type: 'Person',
          discriminatorValue: 'employee',
          properties: {
            employeeId: 'string'
          }
        },
        {
          name: 'User',
          type: 'Person',
          discriminatorValue: 'user',
          properties: {
            userId: 'string'
          }
        }
      ]);

      const typ1 = library.createType({
        name: 'typ1',
        type: 'Employee'
      });
      const validate = typ1.validator({coerceTypes: true});
      validate({kind: 'employee', name: 'name'});
      assert.throws(() => validate({kind: 'user', name: 'name'}),
          /Object kind value must be "employee"/);
      assert.throws(() => validate({name: 'name'}),
          /Object kind value must be "employee"/);
    });

  });

  describe('coercion', function() {
    it('should coerce value to JSON type', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'object'
      });
      const validate = typ1.validator({coerceTypes: true});
      assert.deepStrictEqual(validate({}), {});
      assert.strictEqual(validate(obj1), obj1);
    });

    it('should coerce default value to JSON type', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'object',
        default: obj1
      });
      const validate = typ1.validator({coerceTypes: true});
      assert.deepStrictEqual(validate(), obj1);
    });

    it('should coerce value to JS type', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'object'
      });
      const validate = typ1.validator({coerceJSTypes: true});
      assert.deepStrictEqual(validate(obj1), obj1);
    });

    it('should coerce default value to JS type', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'object',
        default: obj1
      });
      const validate = typ1.validator({coerceJSTypes: true});
      assert.deepStrictEqual(validate(), obj1);
    });

  });

});
