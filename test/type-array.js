/* eslint-disable */
const assert = require('assert');
const TypeLibrary = require('../lib/type-system/TypeLibrary');

describe('ArrayType', function() {
  const library = new TypeLibrary();

  it('should accept any types in non strict mode', function() {
    const prm1 = library.create({
      name: 'prm1',
      type: 'array'
    });
    const arr = [1, 2, 3];
    const validate = prm1.validator({throwOnError: true});
    assert.deepStrictEqual(validate(arr), {valid: true, value: arr});
    assert.strictEqual(validate(arr).value, arr);
    assert.deepStrictEqual(validate(''), {valid: true, value: ''});
    assert.deepStrictEqual(validate(false), {valid: true, value: false});
    assert.deepStrictEqual(validate({}), {valid: true, value: {}});
  });

  it('should throw error for non-array values in strict mode', function() {
    const prm1 = library.create({
      name: 'prm1',
      type: 'array'
    });
    const arr = [1, 2, 3];
    const validate = prm1.validator({throwOnError: true, strictTypes: true});
    assert.deepStrictEqual(validate(arr), {valid: true, value: arr});
    assert.strictEqual(validate(arr).value, arr);
    assert.throws(() => validate(''), /Value must be an array/);
    assert.throws(() => validate(false), /Value must be an array/);
    assert.throws(() => validate({}), /Value must be an array/);
  });

  it('should validate item type', function() {
    const typ1 = library.create({
      name: 'typ1',
      type: 'array',
      items: 'string'
    });
    const validate = typ1.validator({throwOnError: true});
    assert.deepStrictEqual(validate('abc'), {valid: true, value: 'abc'});
    assert.deepStrictEqual(validate(['abc']), {valid: true, value: ['abc']});
    assert.throws(() => validate([{}]),
        /Value must be a string/);
  });

  it('should coerce value to array type', function() {
    const typ1 = library.create({
      name: 'typ1',
      type: 'array'
    });
    const validate = typ1.validator({coerceTypes: true});
    assert.deepStrictEqual(
        validate(false),
        {valid: true, value: [false]});
    assert.deepStrictEqual(validate(0), {valid: true, value: [0]});
    assert.deepStrictEqual(validate(''), {valid: true, value: ['']});
    assert.deepStrictEqual(validate('abc'), {valid: true, value: ['abc']});
  });

  it('should coerce sub items', function() {
    const typ1 = library.create({
      name: 'typ1',
      type: 'array',
      items: 'string'
    });
    const validate = typ1.validator({coerceTypes: true});
    assert.deepStrictEqual(
        validate('abc'),
        {valid: true, value: ['abc']});
    assert.deepStrictEqual(validate(1), {valid: true, value: ['1']});
  });

  it('should coerce default value to array type', function() {
    const prm1 = library.create({
      name: 'prm1',
      type: 'array',
      default: 1
    });
    const validate = prm1.validator({coerceTypes: true});
    assert.deepStrictEqual(validate(), {valid: true, value: [1]});
  });

  it('should validate min item count', function() {
    const prm1 = library.create({
      name: 'prm1',
      type: 'array',
      minItems: 2
    });
    const validate = prm1.validator({throwOnError: true});
    validate([1, 2]);
    assert.throws(() => validate([1]),
        /Minimum accepted array length is 2, actual 1/);
  });

  it('should validate min item count', function() {
    const prm1 = library.create({
      name: 'prm1',
      type: 'array',
      maxItems: 2
    });
    const validate = prm1.validator({throwOnError: true});
    validate([1, 2]);
    assert.throws(() => validate([1, 2, 3]),
        /Maximum accepted array length is 2, actual 3/);
  });

  it('should validate unique items', function() {
    const prm1 = library.create({
      name: 'prm1',
      type: 'array',
      uniqueItems: true
    });
    const validate = prm1.validator({throwOnError: true});
    validate([1, 2]);
    assert.throws(() =>
            validate([1, 2, 3, 3]),
        /Unique array contains non-unique items/);
  });

  it('should create array type by adding [] after type name', function() {
    const prm1 = library.create({
      name: 'prm1',
      type: 'string[]'
    });
    const arr = ['1', '2', '3'];
    const validate = prm1.validator({throwOnError: true});
    assert.deepStrictEqual(validate(arr), {valid: true, value: arr});
    assert.strictEqual(validate(arr).value, arr);
    assert.deepStrictEqual(validate(''), {valid: true, value: ''});
  });

});
