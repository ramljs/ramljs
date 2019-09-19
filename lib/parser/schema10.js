const TypeLibrary = require('../type-system/TypeLibrary');

const Raml10Schema = {
  'UriParameter': {
    'type': 'object'
  },
  'Resource': {
    'type': 'object'
  },
  'Annotation': {
    'type': 'object'
  },
  'Api': {
    'properties': {
      'METADATA': 'any',
      'title': 'string',
      'description?': 'string',
      'version?': 'string',
      'baseUri?': 'string',
      'baseUriParameters?': 'any',
      'protocols?': 'string[]',
      'mediaType?': 'string',
      'documentation?': 'any',
      'types?': 'any',
      'traits?': 'any',
      'resourceTypes?': 'any',
      'annotationTypes?': 'any',
      'securitySchemes?': 'any',
      'securedBy?': 'any',
      'uses?': 'any',
      '/\\([^)]+\\)/': 'any',
      '/^\\/.*/': 'any'
    }
  }
};

const library = new TypeLibrary({
  defaults: {
    required: true,
    additionalProperties: false
  }
});
library.addAll(Raml10Schema);
module.exports = library;
