'use strict';
const path = require('path');
const {LibraryBase} = require('./Library');
const {HasResources} = require('./Resource');
const {implement, Secured} = require('./common');


class Api extends LibraryBase {

  constructor() {
    super();
    this.title = null;
    this.description = null;
    this.version = null;
    this.baseUri = null;
    this.baseUriParameters = null;
    this.protocols = [];
    this.mediaType = null;
    this.documentation = null;
  }

  get api() {
    return this;
  }

  async _load(doc, ctx = {}) {
    if (doc.METADATA.fragmentType)
      throw new Error(`Can not load "${doc.METADATA.fragmentType}" fragment as Api`);
    if (!doc.title)
      throw new Error('Raml api document requires "title" property');

    super._load(doc, ctx);

    ['title', 'description', 'version', 'baseUri', 'mediaType',
      'documentation'].forEach(k => {
      if (doc[k] != null)
        this[k] = String(doc[k]);
    });
    if (doc.protocols)
      this.protocols.push(...doc.protocols);

    Secured.init(this, doc.securedBy);

    if (doc.baseUriParameters_) {
      this.baseUriParameters = this.api.types.createType({
        name: 'baseUriParameters',
        properties: doc.baseUriParameters
      });
    }

    // HasResources.init(this, doc.resources);
  }

}

implement(Api, Secured, HasResources);

module.exports = {Api};
