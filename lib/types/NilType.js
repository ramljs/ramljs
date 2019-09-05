'use strict';
const AnyType = require('./AnyType');

class NilType extends AnyType {

  constructor(library, decl) {
    decl.required = undefined;
    decl.default = undefined;
    super(library, decl);
  }

  get baseType() {
    return 'nil';
  }

  get typeFamily() {
    return 'scalar';
  }

  _generateValidationCode(options) {
    const data = super._generateValidationCode(options);
    data.code = '    if (value === undefined) value = null;' + data.code + `
    error({
        message: 'Value must be null',
        errorType: 'invalid-data-type',
        path
    });
    return;        
        `;
    return data;
  }
}

module.exports = NilType;
