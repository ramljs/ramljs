'use strict';
const NumberType = require('./NumberType');

const IntegerFormats = NumberType.IntegerFormats;

class IntegerType extends NumberType {

  get baseType() {
    return 'integer';
  }

  get enum() {
    return this.attributes.enum;
  }

  set enum(v) {
    if (v && !Array.isArray(v))
      throw new TypeError('Array type required for "enum" property');
    this.attributes.enum = v == null ? v : v.map(x => parseInt(x, 10));
  }

  get format() {
    return this.attributes.format || 'int';
  }

  set format(v) {
    if (v && !IntegerFormats.includes(v))
      throw new TypeError(`Unknown integer format (${v})`);
    this.attributes.format = v;
  }

  get minimum() {
    return this.attributes.minimum;
  }

  set minimum(v) {
    this.attributes.minimum = v == null ? v :
        parseInt(v, 10) || 0;
  }

  get maximum() {
    return this.attributes.maximum;
  }

  set maximum(v) {
    this.attributes.maximum = v == null ? v :
        parseInt(v, 10) || 0;
  }

  get multipleOf() {
    return this.attributes.multipleOf;
  }

  set multipleOf(v) {
    this.attributes.multipleOf = v == null ? v :
        parseInt(v, 10) || 0;
  }

}

module.exports = IntegerType;
