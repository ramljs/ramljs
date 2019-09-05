'use strict';
const AnyType = require('./AnyType');

class BooleanType extends AnyType {
  get baseType() {
    return 'boolean';
  }

  get typeFamily() {
    return 'scalar';
  }

  _generateValidationCode(options) {
    const data = super._generateValidationCode(options);
    const {strictTypes} = options;
    const coerce = options.coerceTypes || options.coerceJSTypes;
    data.code += `
            if (!(typeof value === 'boolean'`;
    if (!strictTypes)
      data.code +=
          ` || (value === 0 || value === 1 || value === 'false' || value === 'true')`;
    data.code += `)
            ) {
                error({
                    message: 'Value must be a boolean',
                    errorType: 'invalid-data-type',
                    path
                });
                return;
            }            
`;
    if (coerce && !strictTypes)
      data.code += '\n    value = value === \'false\' ? false : !!value';
    return data;
  }
}

module.exports = BooleanType;
