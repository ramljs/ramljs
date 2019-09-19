/* eslint-disable */
const assert = require('assert');
const TypeLibrary = require('../lib/type-system/TypeLibrary');

describe('AnyType', function() {

  const library = new TypeLibrary();

  it('should assign default facets', function() {
    let typ1 = library.create({
      type: 'any',
      name: 'typ1',
      displayName: 'displayName',
      description: 'description',
      example: 'example',
      required: true,
      default: 0
    });
    assert.strictEqual(typ1.name, 'typ1');
    assert.strictEqual(typ1.baseType, 'any');
    assert.strictEqual(typ1.displayName, 'displayName');
    assert.strictEqual(typ1.required, true);
    assert.strictEqual(typ1.default, 0);
  });

  it('should use default value if given value is null', function() {
    const typ1 = library.create({
      name: 'typ1',
      type: 'any',
      required: true,
      default: 123
    });
    const validate = typ1.validator();
    assert.strictEqual(validate(null).value, 123);
  });

  it('should not validate null value if required=true', function() {
    const typ1 = library.create({
      name: 'typ1',
      type: 'any',
      required: true
    });
    const validate = typ1.validator({throwOnError: true});
    assert.strictEqual(validate(0).value, 0);
    assert.strictEqual(validate('0').value, '0');
    assert.throws(() => validate(), /Value required/);
    assert.throws(() => validate(null), /Value required/);
  });

  it('should return "errors" property on error', function() {
    const typ1 = library.create({
      name: 'typ1',
      type: 'any',
      required: true
    });
    const validate = typ1.validator();
    assert.deepStrictEqual(validate(), {
      valid: false,
      errors: [{
        errorType: 'value-required',
        message: 'Value required for typ1',
        path: 'typ1'
      }]
    });
  });

  it('should types inherit from compatible types', function() {
    library.add({
      name: 'bool1',
      type: 'boolean'
    });
    library.create({
      name: 'typ1',
      type: ['boolean', 'bool1']
    });
    library.create({
      name: 'typ1',
      type: ['bool1', 'boolean']
    });
  });

  it('should not inherit from incompatible types', function() {
    const tryType = (t) => {
      assert.throws(() =>
          library.create({
            name: 'typ1',
            type: ['boolean', t]
          }), new RegExp('Can\'t extend boolean type from ' + t));
    };
    ['any', 'number', 'integer', 'string', 'array',
      'object', 'datetime', 'union']
        .forEach(tryType);
  });

});
