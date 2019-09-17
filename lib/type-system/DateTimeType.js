'use strict';
const DateType = require('./DateType');

class DateTimeType extends DateType {

  get baseType() {
    return 'datetime';
  }

  hasFacet(n) {
    return n === 'format' || super.hasFacet(n);
  }

  _mergeOnto(target, overwrite) {
    super._mergeOnto(target, overwrite);
    target.attributes.format = overwrite ?
        (this.attributes.format || target.attributes.format) :
        (target.attributes.format || this.attributes.format);
  }
}

module.exports = DateTimeType;
