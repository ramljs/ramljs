const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const TypeLibrary = require('../type-system/TypeLibrary');

const Raml10Schema = yaml.safeLoad(
    fs.readFileSync(path.join(__dirname, 'schema10.yaml'), 'utf8'));

const library = new TypeLibrary({
  defaults: {
    required: true,
    additionalProperties: false
  }
});
library.addAll(Raml10Schema);
module.exports = library;
