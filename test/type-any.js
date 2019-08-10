/* eslint-disable */
const assert = require('assert');
const {TypeLibrary} = require('../lib/types/TypeLibrary');

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
    assert.deepStrictEqual(typ1.type, ['any']);
    assert.strictEqual(typ1.displayName, 'displayName');
    assert.strictEqual(typ1.description, 'description');
    assert.strictEqual(typ1.example, 'example');
    assert.strictEqual(typ1.required, true);
    assert.strictEqual(typ1.default, 0);
    assert.deepStrictEqual(typ1.annotations, {a: 1});
    assert.deepStrictEqual(typ1.facets.facet1.baseType, 'any');
    typ1 = library.createType({
      name: 'typ1',
      type: 'any',
      examples: ['examples']
    });
    assert.deepStrictEqual(typ1.examples, ['examples']);
  });

  it('should check name argument in constructor', function() {
    assert.throws(() =>
        library.addType({
          type: 'any'
        }), /You must provide "name" argument/);
  });

  it('should use default value if given value is null', function() {
    const typ1 = library.createType({
      name: 'typ1',
      type: 'any',
      required: true,
      default: 123
    });
    const validate = typ1.validator();
    assert.strictEqual(validate(null), 123);
  });

  it('should not validate null value if required=true', function() {
    const typ1 = library.createType({
      name: 'typ1',
      type: 'any',
      required: true
    });
    const validate = typ1.validator();
    assert.strictEqual(validate(0), 0);
    assert.strictEqual(validate('0'), '0');
    assert.throws(() => validate(), /Value required/);
    assert.throws(() => validate(null), /Value required/);
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

  it('should not types inherit from incompatible types', function() {
    const tryType = (t) => {
      assert.throws(() => library.createType({
        name: 'typ1',
        type: ['boolean', t]
      }), new RegExp('Can\'t extend boolean type from ' + t));
    };
    ['any', 'number', 'integer', 'string', 'array', 'object', 'datetime',
      'union']
        .forEach(tryType);
  });

});
