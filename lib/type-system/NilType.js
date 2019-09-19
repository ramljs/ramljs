'use strict';
const AnyType = require('./AnyType');

class NilType extends AnyType {

  get baseType() {
    return 'nil';
  }

  get required() {
    return false;
  }

  set required(v) {
    this.attributes.required = undefined;
  }

  get default() {
    return null;
  }

  set default(v) {
    this.attributes.default = undefined;
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
