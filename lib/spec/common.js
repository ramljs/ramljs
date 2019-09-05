'use strict';
const merge = require('putil-merge');

class ApiElement {
  constructor(parent) {
    Object.defineProperty(this, 'parent', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: parent
    });
    Object.defineProperty(this, 'api', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: parent.api ||
          (Object.getPrototypeOf(parent).constructor.name === 'Api' ?
              parent : null)
    });
  }
}

class Annotable {
  static init(target, annotations) {
    target.annotations = {};
    if (annotations) {
      target.annotations.push(...annotations);
    }
  }
}

class Secured {
  static init(target, securedBy) {
    target.securedBy = [];
    if (securedBy) {
      target.securedBy.push(...securedBy);
    }
  }
}


function implement(target, ...source) {
  merge.all([target.prototype, ...source.map(x => x.prototype)], {
    descriptor: true,
    filter: (_, n) =>
        !['constructor', 'prototype', 'name', 'length'].includes(n)
  });
}

module.exports = {
  ApiElement,
  Annotable,
  Secured,
  implement
};
