/* eslint-disable */
const assert = require('assert');
const TypeLibrary = require('../lib/type-system/TypeLibrary');

describe('UnionType', function() {

  const library = new TypeLibrary();

  it('should get subType', function() {
    const prm1 = library.create({
      name: 'prm1',
      type: 'union',
      anyOf: ['string']
    });
    const validate = prm1.validator({throwOnError: true});
    assert.deepStrictEqual(prm1.subType, 'string');
  });

});
