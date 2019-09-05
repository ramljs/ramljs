'use strict';
const path = require('path');
const {implement, ApiElement, Annotable, Secured} = require('./common');

/**
 * @class HasResources
 */
class HasResources {

  static init(target, resources) {
    target.resources = {};
    if (resources)
      resources.forEach(o => target.addResource(o));
  }

  addResource(resource) {
    if (this.resources[resource.relativeUri])
      throw new Error(`Resource '${resource.relativeUri}' already exists`);
    if (!(resource instanceof Resource))
      this.resources[resource.relativeUri] = new Resource(this, resource);
  }

  visitResources(fn) {
    for (const relativeUri of Object.keys(this.resources)) {
      const resource = this.resources[relativeUri];
      if (fn(resource))
        return;
      resource.visitResources(fn);
    }
  }

}

/**
 * @class HasHeaders
 */
class HasHeaders {
  static init(target, headers) {
    target.headers = null;
    if (headers)
      headers.forEach(r => target.addHeader(r));
  }

  addHeader(def) {
    this.headers = this.headers || {};
    this.headers[def.name] =
        this.api.types.createType({...def, name: 'header'});
  }
}

/**
 * @class HasBody
 */
class HasBody {
  static init(target, bodies) {
    target.body = null;
    if (bodies)
      bodies.forEach(r => target.addBody(r));
  }

  addBody(def) {
    this.body = this.body || {};
    this.body[def.name] = this.api.types.createType({...def, name: 'body'});
  }
}

/**
 * @class Request
 */
class Request extends ApiElement {
  constructor(parent, def = {}) {
    super(parent);
    Annotable.init(this, def.annotations);
    HasHeaders.init(this, def.headers);
    this.queryParameters = null;
    this.queryString = null;
    this.responses = null;
    if (def.queryParameters && def.queryString)
      throw new Error('Can not use "queryParameters" and "queryString" at same time');
    if (def.queryParameters)
      def.queryParameters.forEach(r => this.addQueryParameter(r));
    if (def.queryString)
      this.setQueryString(def.queryString);
    if (def.responses)
      def.responses.forEach(r => this.addResponse(r));
  }

  addQueryParameter(def) {
    this.queryParameters = this.queryParameters || {};
    this.queryParameters[def.name] =
        this.api.types.createType({...def, name: 'query'});
  }

  addResponse(def) {
    this.responses = this.responses || {};
    this.responses[def.code] = new Response(this, def);
  }

  setQueryString(def) {
    this.queryString = this.api.types.createType({...def, name: 'query'});
  }

}

implement(Request, Annotable, HasHeaders);

/**
 * @class Response
 */
class Response extends ApiElement {

  constructor(parent, def = {}) {
    super(parent);
    this.code = def.code;
    this.description = def.description;
    Annotable.init(this, def.annotations);
    HasHeaders.init(this, def.headers);
    HasBody.init(this, def.body);
  }

}

implement(Response, Annotable, HasHeaders, HasBody);

/**
 * @class Resource
 */
class Resource extends ApiElement {

  constructor(parent, def = {}) {
    super(parent);
    this.displayName = def.displayName;
    this.relativeUri = def.relativeUri;
    this.completeRelativeUri = def.completeRelativeUri;
    this.methods = {};
    this.uriParameters = null;
    if (def.uriParameters) {
      this.uriParameters = this.api.types.createType({
        name: 'uri',
        properties: def.uriParameters
      });
    }

    if (!this.completeRelativeUri) {
      let s = this.relativeUri;
      let p = this;
      while ((p = p.parent) && p instanceof Resource)
        s = p.relativeUri + s;
      this.completeRelativeUri = s;
    }

    if (def.methods)
      def.methods.forEach(x => this.addMethod(x));

    Annotable.init(this, def.annotations);
    HasResources.init(this, def.resources);
  }

  addMethod(def) {
    if (this.methods[def.method])
      throw new Error(`Method '${def.method} already defined`);
    this.methods[def.method] = new Method(this, def);
  }

  visitMethods(fn) {
    for (const name of Object.keys(this.methods)) {
      const method = this.methods[name];
      if (fn(method))
        return;
    }
  }

}

implement(Resource, Annotable, HasResources);

/**
 * @class Method
 */
class Method extends Request {

  constructor(resource, def = {}) {
    super(resource, def);
    this.displayName = def.displayName;
    this.description = def.description;
    this.method = def.method;
    Annotable.init(this, def.annotations);
    this.handler = null;
    HasHeaders.init(this, def.headers);
    HasBody.init(this, def.body);
  }

}

implement(Method, Annotable, HasHeaders, HasBody);

/**
 *
 * Expose
 */
module.exports = {
  HasResources,
  HasHeaders,
  HasBody,
  Request,
  Response,
  Resource,
  Method
};
