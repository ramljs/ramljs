/* eslint-disable */
const assert = require('assert');
const TypeLibrary = require('../lib/types/TypeLibrary');

describe('AnyType', function() {

  const library = new TypeLibrary();

  it('should assign default facets', function() {
    let typ1 = library.createType({
      name: 'typ1',
      type: 'any',
      displayName: 'displayName',
      description: 'description',
      example: 'example',
      required: true,
      default: 0,
      enum: [0, 1, 2],
      annotations: [{name: 'a', value: 1}],
      facets: [{name: 'facet1', type: 'any'}]
    });
    assert.strictEqual(typ1.name, 'typ1');
    assert.strictEqual(typ1.baseType, 'any');
    assert.strictEqual(typ1.attributes.displayName, 'displayName');
    assert.strictEqual(typ1.attributes.description, 'description');
    assert.strictEqual(typ1.attributes.example, 'example');
    assert.strictEqual(typ1.attributes.required, true);
    assert.strictEqual(typ1.attributes.default, 0);
    assert.deepStrictEqual(typ1.annotations, {a: 1});
    assert.deepStrictEqual(typ1.facets.facet1.baseType, 'any');
    typ1 = library.createType({
      name: 'typ1',
      type: 'any',
      examples: ['examples']
    });
    assert.deepStrictEqual(typ1.attributes.examples, ['examples']);
  });

  it('should use default value if given value is null', function() {
    const typ1 = library.createType({
      name: 'typ1',
      type: 'any',
      required: true,
      default: 123
    });
    const validate = typ1.validator();
    assert.strictEqual(validate(null).value, 123);
  });

  it('should not validate null value if required=true', function() {
    const typ1 = library.createType({
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
    const typ1 = library.createType({
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
    library.addType({
      name: 'bool1',
      type: 'boolean'
    });
    library.createType({
      name: 'typ1',
      type: ['boolean', 'bool1']
    });
    library.createType({
      name: 'typ1',
      type: ['bool1', 'boolean']
    });
  });

  it('should not inherit from incompatible types', function() {
    const tryType = (t) => {
      assert.throws(() =>
          library.createType({
            name: 'typ1',
            type: ['boolean', t]
          }), new RegExp('Can\'t extend boolean type from ' + t));
    };
    ['any', 'number', 'integer', 'string', 'array',
      'object', 'datetime', 'union']
        .forEach(tryType);
  });

});
