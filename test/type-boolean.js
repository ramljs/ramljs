/* eslint-disable */
const assert = require('assert');
const {TypeLibrary} = require('../lib/types/TypeLibrary');

describe('BooleanType', function() {

  const library = new TypeLibrary();

  it('should validate compatible values', function() {
    const typ1 = library.createType({
      name: 'typ1',
      type: 'boolean'
    });
    const validate = typ1.validator();
    assert.strictEqual(validate(null), null);
    assert.strictEqual(validate(false), false);
    assert.strictEqual(validate(true), true);
    assert.strictEqual(validate(0), 0);
    assert.strictEqual(validate(1), 1);
    assert.strictEqual(validate('false'), 'false');
    assert.strictEqual(validate('true'), 'true');
    assert.throws(() => validate(12), /Value must be a boolean/);
    assert.throws(() => validate(''), /Value must be a boolean/);
    assert.throws(() => validate([]), /Value must be a boolean/);
    assert.throws(() => validate({}), /Value must be a boolean/);
  });

  it('should throw error for non-boolean values in strict mode', function() {
    const typ1 = library.createType({
      name: 'typ1',
      type: 'boolean'
    });
    const validate = typ1.validator({strictTypes: true});
    validate(false);
    validate(true);
    validate(null);
    assert.throws(() => validate(0), /Value must be a boolean/);
    assert.throws(() => validate(1), /Value must be a boolean/);
    assert.throws(() => validate('false'), /Value must be a boolean/);
    assert.throws(() => validate('true'), /Value must be a boolean/);
    assert.throws(() => validate(''), /Value must be a boolean/);
  });

  it('should coerce value to boolean type', function() {
    const typ1 = library.createType({
      name: 'typ1',
      type: 'boolean'
    });
    const validate = typ1.validator({coerceTypes: true});
    assert.strictEqual(validate(false), false);
    assert.strictEqual(validate(true), true);
    assert.strictEqual(validate(0), false);
    assert.strictEqual(validate(1), true);
    assert.strictEqual(validate('false'), false);
    assert.strictEqual(validate('true'), true);
  });

  it('should coerce default value to boolean type', function() {
    const typ1 = library.createType({
      name: 'typ1',
      type: 'boolean',
      default: 1
    });
    const validate = typ1.validator({coerceTypes: true});
    assert.strictEqual(validate(), true);
  });

});
