/* eslint-disable */
const assert = require('assert');
const {TypeLibrary} = require('../lib/types/TypeLibrary');

describe('UnionType', function() {
  return;
  let library = new TypeLibrary();

  beforeEach(function() {
    library = new TypeLibrary();
  });

  describe('validation', function() {

    it('should check required', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'union',
        anyOf: ['boolean', 'number'],
        required: true
      });

      const validate = typ1.validator();
      assert.throws(() => validate(), /Value required/);
      assert.throws(() => validate(null), /Value required/);
    });

    it('should not check required if default value assigned', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'union',
        required: true,
        anyOf: ['boolean', 'number'],
        default: true
      });

      const validate = typ1.validator();
      validate();
      validate(null);
    });

    it('should validate any of items', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'union',
        anyOf: ['datetime-only', 'string', 'nil', 'boolean', 'number']
      });
      const validate = typ1.validator();
      validate('1');
      validate(1);
      validate(true);
      validate('2015-03-01');
      validate();
      validate(null);
    });

    it('should throw error if no match found', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'union',
        anyOf: ['date-only', 'integer']
      });
      const validate = typ1.validator();
      assert.throws(() => validate('abc'), /Value does not match any of types/);
      assert.throws(() => validate([]), /Value does not match any of types/);
    });

  });

  describe('coercion', function() {
    it('should coerce value to JSON type', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'union',
        anyOf: ['datetime-only', 'string', 'nil', 'boolean', 'number']
      });
      const validate = typ1.validator({coerceTypes: true});
      assert.strictEqual(validate('1'), '1');
      assert.strictEqual(validate(1), 1);
      assert.strictEqual(validate(true), true);
      assert.strictEqual(validate('2015-03-01'), '2015-03-01T00:00:00');
      assert.strictEqual(validate(), null);
      assert.strictEqual(validate(null), null);
    });

    it('should coerce value to JS type', function() {
      const typ1 = library.createType({
        name: 'typ1',
        type: 'union',
        anyOf: ['datetime-only', 'string', 'nil', 'boolean', 'number']
      });
      const validate = typ1.validator({coerceJSTypes: true});
      assert.strictEqual(validate('1'), '1');
      assert.strictEqual(validate(1), 1);
      assert.strictEqual(validate(true), true);
      assert.deepStrictEqual(validate('2015-03-01'), new Date('2015-03-01T00:00:00.000Z'));
      assert.strictEqual(validate(), null);
      assert.strictEqual(validate(null), null);
    });

    it('should coerce with exact matching', function() {
      library.addType(
          {
            name: 'Person',
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
          });

      const typ1 = library.createType({
        name: 'typ1',
        type: 'union',
        anyOf: ['Employee', 'User']
      });
      const validate = typ1.validator({coerceTypes: true});
      assert.deepStrictEqual(validate({
        kind: 'user',
        name: 'user'
      }), {
        kind: 'user',
        name: 'user'
      });

    });

  });

  it('should coerce with seamless matching', function() {
    library.addType(
        {
          name: 'Person',
          additionalProperties: false,
          properties: {
            name: 'string',
            kind: 'string'
          }
        },
        {
          name: 'Employee',
          type: 'Person',
          properties: {
            id: 'string',
            employeeId: 'string'
          }
        },
        {
          name: 'User',
          type: 'Person',
          properties: {
            id: 'number',
            userId: 'string'
          }
        });

    const typ1 = library.createType({
      name: 'typ1',
      type: 'union',
      anyOf: ['Employee', 'User']
    });
    const validate = typ1.validator({coerceTypes: true, removeAdditional: true});

    assert.deepStrictEqual(validate({
      kind: 'user',
      name: 'user',
      id: 1
    }), {
      kind: 'user',
      name: 'user',
      id: 1
    });

    assert.deepStrictEqual(validate({
      kind: 'user',
      name: 'user',
      userId: 1
    }), {
      kind: 'user',
      name: 'user',
      userId: '1'
    });

  });

});
