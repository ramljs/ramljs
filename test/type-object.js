/* eslint-disable */
const assert = require('assert');
const {TypeLibrary} = require('../lib/types/TypeLibrary');

describe('ObjectType', function() {

  const library = new TypeLibrary();
  const obj1 = {a: 1, b: '2', c: 'c', d: [1, '2', 3.3], e: 1};
  const val1 = {a: '1', b: 2, c: 'c', d: [1, '2', 3.3], e: true};
  const properties1 = {
    a: 'string',
    b: 'number',
    c: 'string',
    d: 'array',
    e: 'boolean'
  };

  it('should apply type check', function() {
    const prm1 = library.createType({
      name: 'prm1',
      type: 'object'
    });
    const validate = prm1.validator({throwOnError: true});
    assert.deepStrictEqual(validate(obj1), {valid: true, value: obj1});
    assert.strictEqual(validate(obj1).value, obj1);
    assert.throws(() => validate(''), /Value must be an object/);
    assert.throws(() => validate(false), /Value must be an object/);
    assert.throws(() => validate([]), /Value must be an object/);
  });

  it('should not allow additional properties if additionalProperties=false', function() {
    const typ1 = library.createType({
      name: 'typ1',
      type: 'object',
      properties: properties1,
      additionalProperties: false
    });
    const validate = typ1.validator({throwOnError: true});
    assert.throws(() =>
            validate({...obj1, f: 'f'}),
        /Object type does not allow additional properties/
    );
  });

  it('should allow additional properties if additionalProperties=true', function() {
    const typ1 = library.createType({
      name: 'typ1',
      type: 'object',
      properties: properties1
    });
    const validate = typ1.validator({throwOnError: true});
    validate({...obj1, f: 'f'});
  });

  it('should validate minProperties', function() {
    const typ1 = library.createType({
      name: 'typ1',
      type: 'object',
      minProperties: 2
    });
    const validate = typ1.validator({throwOnError: true});
    assert.throws(() => validate(validate({a: 1})),
        /Minimum accepted properties 2, actual 1/);
  });

  it('should validate maxProperties', function() {
    const typ1 = library.createType({
      name: 'typ1',
      type: 'object',
      maxProperties: 2
    });
    const validate = typ1.validator({throwOnError: true});
    assert.throws(() => validate(validate({a: 1, b: 2, c: 3})),
        /Maximum accepted properties 2, actual 3/);
  });

  it('should check discriminator', function() {
    library.addTypes([
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
    const validate = typ1.validator({throwOnError: true});
    validate({kind: 'employee', name: 'name'});
    assert.throws(() =>
            validate({kind: 'user', name: 'name'}
            ),
        /Object`s discriminator property \(kind\) does not match to "employee"/);
    assert.throws(() => validate({name: 'name'}),
        /Object`s discriminator property \(kind\) does not match to "employee"/);
  });

});
