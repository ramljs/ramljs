/* eslint-disable */
const assert = require('assert');
const TypeLibrary = require('../lib/type-system/TypeLibrary');

describe('ObjectType', function() {

  const library = new TypeLibrary({
    defaults: {required: true}
  });
  const obj1 = {a: 1, b: '2', c: 'c', d: [1, '2', 3.3], e: 1};
  const properties1 = {
    'a?': 'string',
    'b?': 'number',
    'c?': 'string',
    'd?': 'array',
    'e?': 'boolean'
  };

  it('should apply type check', function() {
    const prm1 = library.create({
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
    const typ1 = library.create({
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

  it('should remove additional properties if removeAdditional=true', function() {
    const typ1 = library.create({
      name: 'typ1',
      type: 'object',
      properties: properties1
    });
    const validate = typ1.validator({
      throwOnError: true,
      removeAdditional: true
    });
    assert.deepStrictEqual(
        validate({...obj1, f: 'f'}).value,
        obj1);
  });

  it('should allow additional properties if additionalProperties=true', function() {
    const typ1 = library.create({
      name: 'typ1',
      type: 'object',
      properties: properties1
    });
    const validate = typ1.validator({throwOnError: true});
    validate({...obj1, f: 'f'});
  });

  it('should use regexp patterns as property names', function() {
    const typ1 = library.create({
      name: 'typ1',
      type: 'object',
      additionalProperties: false,
      properties: {
        '/a[\\d]/': 'any'
      }
    });
    const validate = typ1.validator({
      throwOnError: true,
      removeAdditional: true
    });
    assert.deepStrictEqual(
        validate({a1: 1, a2: 2, b1: 3}).value,
        {a1: 1, a2: 2});
  });

  it('should validate minProperties', function() {
    const typ1 = library.create({
      name: 'typ1',
      type: 'object',
      minProperties: 2
    });
    const validate = typ1.validator({throwOnError: true});
    assert.throws(() => validate(validate({a: 1})),
        /Minimum accepted properties 2, actual 1/);
  });

  it('should validate maxProperties', function() {
    const typ1 = library.create({
      name: 'typ1',
      type: 'object',
      maxProperties: 2
    });
    const validate = typ1.validator({throwOnError: true});
    assert.throws(() => validate(validate({a: 1, b: 2, c: 3})),
        /Maximum accepted properties 2, actual 3/);
  });

  it('should validate properties', function() {
    const typ1 = library.create({
      name: 'typ1',
      properties: {
        'id': {type: 'string', required: true},
        'name': 'string'
      }
    });
    const validate = typ1.validator({
      throwOnError: true,
      removeAdditional: true
    });
    assert.throws(() =>
            validate({name: 'name'}),
        /Value required/);

  });

  it('should find right object in union using discriminator', function() {
    library.add(
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
    );

    const typ1 = library.create({
      name: 'typ1',
      type: 'Employee',
      additionalProperties: false
    });
    const validate = typ1.validator({
      throwOnError: true
    });
    assert.throws(() => validate({kind: 'user', name: 'name'}),
        /Object`s discriminator property \(kind\) does not match to "employee"/);
    assert.throws(() => validate({name: 'name'}),
        /Object`s discriminator property \(kind\) does not match to "employee"/);
    assert.deepStrictEqual(
        validate({
          kind: 'employee',
          name: 'name',
          employeeId: 1
        }).value,
        {kind: 'employee', name: 'name', employeeId: 1});
  });

  it('should find right type using typeOf method', function() {
    const library = new TypeLibrary();
    library.add(
        {
          name: 'Employee',
          properties: {
            name: 'string',
            kind: 'string',
            employeeId: 'string'
          }
        },
        {
          name: 'User',
          properties: {
            name: 'string',
            kind: 'string',
            userId: 'string'
          }
        }
    );

    const typ1 = library.create({
      name: 'typ1',
      type: library.create({
        type: 'union',
        anyOf: ['Employee', 'User']
      }), typeOf: (v, t) => {
        if (t.properties.userId)
          return !!v.userId;
        if (t.properties.employeeId)
          return !!v.employeeId;
      }
    });
    const validate = typ1.validator({
      throwOnError: true,
      removeAdditional: true
    });

    assert.deepStrictEqual(
        validate({
          name: 'name',
          employeeId: 1
        }).value,
        {name: 'name', employeeId: 1});

    assert.deepStrictEqual(
        validate({
          name: 'name',
          userId: 1
        }).value,
        {name: 'name', userId: 1});
  });

});
