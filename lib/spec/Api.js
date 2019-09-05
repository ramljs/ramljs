'use strict';
const apiLoader = require('../apiLoader');
const {LibraryBase} = require('./LibraryBase');
const {HasResources} = require('./Resource');
const {implement, Annotable, Secured} = require('./common');

class Api extends LibraryBase {

  constructor(def = {}) {
    super(def);
    this.title = def.title;
    this.description = def.description;
    this.version = def.version;
    this.baseUri = def.baseUri;
    this.baseUriParameters = null;
    this.protocols = [];
    this.mediaType = def.mediaType;
    this.documentation = def.documentation;

    if (def.protocols)
      this.protocols.push(...def.protocols);

    if (def.baseUriParameters) {
      this.baseUriParameters = this.api.types.createType({
        name: 'baseUriParameters',
        properties: def.baseUriParameters
      });
    }

    Secured.init(this, def.securedBy);
    HasResources.init(this, def.resources);
  }

  get api() {
    return this;
  }

  static async load(apiFile, options = {}) {
    const doc = await apiLoader.loadApiFile(apiFile, options);
    // console.log(util.inspect(doc, null, 20, true));
    const api = new Api(doc.specification);
    const resourceHandlers = doc.resourceHandlers;
    if (resourceHandlers) {
      api.visitResources(resource => {
        const handlers = resourceHandlers[resource.completeRelativeUri];
        if (!handlers) return;
        resource.visitMethods(method => {
          const fns = handlers[method.method];
          method.handler = Array.isArray(method.handler) ? method.handler :
              (method.handler ? [method.handler]: []);
          if (Array.isArray(fns))
            method.handler.push(...fns);
          else method.handler.push(fns);
        });
      });
    }

    return api;
  }
}

implement(Api, Annotable, Secured, HasResources);

module.exports = {Api};
