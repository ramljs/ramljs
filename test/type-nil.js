/* eslint-disable */
const assert = require('assert');
const TypeLibrary = require('../lib/type-system/TypeLibrary');

describe('NilType', function() {

  const library = new TypeLibrary();

  it('should not check required', function() {
    const prm1 = library.create({
      name: 'prm1',
      type: 'nil',
      required: true
    });
    const validate = prm1.validator();
    validate();
    validate(null);
  });

  it('should validate null value', function() {
    const prm1 = library.create({
      name: 'prm1',
      type: 'nil'
    });
    const validate = prm1.validator({throwOnError: true});
    validate(null);
    validate();
    assert.throws(() => validate(0), /Value must be null/);
    assert.throws(() => validate(''), /Value must be null/);
  });

  it('should coerce value to null', function() {
    const prm1 = library.create({
      name: 'prm1',
      type: 'nil'
    });
    const validate = prm1.validator({coerceTypes: true});
    assert.deepStrictEqual(validate(), {valid: true, value: null});
  });

  it('should always coerce default value to null', function() {
    const prm1 = library.create({
      name: 'prm1',
      type: 'nil',
      default: 1
    });
    const validate = prm1.validator({coerceTypes: true});
    assert.deepStrictEqual(validate(), {valid: true, value: null});
  });

});
