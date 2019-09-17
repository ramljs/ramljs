'use strict';
const path = require('path');
const crypto = require('crypto');
const Router = require('router');
const url = require('url');
const bodyParser = require('body-parser');

function createExpressRouter(api, options = {}) {
  const router = new Router();
  router.use(bodyParser.json());

  api.visitResources(resource => {

    if (!resource.completeRelativeUri)
      return;

    const relativeUri = path.join(options.basePath || '/',
        resource.completeRelativeUri.replace(/{[^}]+}/g, (m) => {
          return ':' + m.substring(1, m.length - 1);
        }));

    let uriValidator;
    if (resource.uriParameters) {
      uriValidator = resource.uriParameters.validator({
        coerceTypes: true,
        ignoreRequire: true,
        throwOnError: true
      });
    }

    resource.visitMethods(method => {

      let queryValidator;
      if (method.queryString)
        queryValidator = method.queryString.validator({
          coerceTypes: true,
          throwOnError: true
        });
      if (method.queryParameters) {
        const t = api.types.createType({
          name: 'queryParameters',
          properties: method.queryParameters
        });
        queryValidator = t.validator({
          coerceTypes: true,
          throwOnError: true
        });
      }

      const requestValidators = {};
      const validateRequestBody = (req, options = {}) => {
        const contentType = req.headers['content-type'] || 'application/json';
        if (!(method.body && method.body[contentType]))
          return req.body;

        const type = method.body[contentType];
        options = {
          coerceTypes: true,
          throwOnError: true,
          removeAdditional: method.removeAdditional != null ?
              method.removeAdditional : !type.additionalProperties,
          ...options
        };
        const hash = crypto.createHash('md5').update(
            JSON.stringify(options)).digest('hex');
        const caches = requestValidators[contentType] =
            (requestValidators[contentType] || {});
        const validator = caches[hash] ||
            (caches[hash] = type.validator(options));
        const x = validator(req.body);
        return options.throwOnError ? x.value : x;
      };

      const responseValidators = {};
      const validateResponse = (res, data, options = {}) => {
        const statusCode = res.statusCode || 200;
        const contentType = (res.headers && res.headers['content-type']) ||
            'application/json';

        const type = method.responses &&
            method.responses[statusCode] &&
            method.responses[statusCode].body &&
            method.responses[statusCode].body[contentType];

        if (!type)
          return {data};

        options = {
          coerceTypes: true,
          throwOnError: true,
          removeAdditional: method.removeAdditional != null ?
              method.removeAdditional : !type.additionalProperties,
          ...options
        };
        const hash = crypto.createHash('md5').update(
            JSON.stringify(options)).digest('hex');
        const caches = responseValidators[statusCode + contentType] =
            (requestValidators[statusCode + contentType] || {});
        const validator = caches[hash] ||
            (caches[hash] = type.validator(options));
        return validator(data);
      };

      router[method.method](relativeUri, function(req, res, next) {
        req.api = api;
        const orgJson = res.json;
        //
        req.json = (options) => validateRequestBody(req, options);
        res.json = (data, options) => {
          const v = validateResponse(res, data, options);
          orgJson.call(res, v.value);
        };

        // Validate url query part
        try {
          // Validate uri parameters
          if (uriValidator) {
            const x = uriValidator(req.params);
            req.params = x.value;
          }

          if (queryValidator) {
            let x;
            if (method.queryString &&
                method.queryString.baseType !== 'object') {
              const url_parts = url.parse(req.url, false);
              x = queryValidator(url_parts.query);
            } else {
              x = queryValidator(req.query);
            }
            req.query = x.value;
          }
        } catch (e) {
          e.statusCode = 400;
          throw e;
        }
        next();
      });

      if (method.handler) {
        const handlers = Array.isArray(method.handler) ? method.handler : [method.handler];
        handlers.forEach(fn =>
            router[method.method](relativeUri, fn));
      }
    });

    // User default error handler
    if (options.defaultErrorHandler)
      router.use(options.defaultErrorHandler);
    // Default error handler
    router.use((err, req, res, next) => {
      const o = {
        status: parseInt(err.status, 10) || parseInt(err.statusCode, 10) || 500,
        errors: null
      };
      if (err.errors) {
        o.errors = err.errors;
      } else {
        const v = {message: err.message};
        Object.assign(v, err);
        o.errors = [v];
      }
      res.status(o.status)
          .end(JSON.stringify(o), null, 2);
    });
  });
  return router;
}

exports.createExpressRouter = createExpressRouter;
