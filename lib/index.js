'use strict';
const TypeLibrary = require('./types/TypeLibrary');
const {Api} = require('./spec/Api');

function expressRouter(api, options) {
  const {createExpressRouter} = require('./expressmw');
  return createExpressRouter(api, options);
}

module.exports = {
  Api,
  TypeLibrary,
  expressRouter
};
