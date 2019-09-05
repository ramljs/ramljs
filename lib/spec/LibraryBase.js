'use strict';
const TypeLibrary = require('../types/TypeLibrary');

class LibraryBase {

  constructor(def = {}) {
    this.uses = null; // TODO
    this.resourceTypes = null; // TODO
    this.types = new TypeLibrary();
    this.traits = null; // TODO
    this.securitySchemes = null; // TODO
    this.annotationTypes = null;

    if (def.types)
      this.types.addTypes(def.types);

    if (def.annotationTypes)
      def.annotationTypes.forEach(r => this.addAnnotationType(r));
  }

  addAnnotationType(def) {
    this.annotationTypes = this.annotationTypes || {};
    this.annotationTypes[def.name] = this.api.types.createType(def);
  }
}

module.exports = {LibraryBase};
