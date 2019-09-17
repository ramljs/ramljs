'use strict';
const {Library} = require('./spec/Library');
const {Api} = require('./spec/Api');

function expressRouter(api, options) {
  const {createExpressRouter} = require('./expressmw');
  return createExpressRouter(api, options);
}

module.exports = {
  Api,
  Library,
  expressRouter
};
