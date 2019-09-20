'use strict';
const AnyType = require('./AnyType');

class ArrayType extends AnyType {

  constructor(library, def) {
    super(library, def);
    Object.assign(this, {
      items: def.items,
      minItems: def.minItems,
      maxItems: def.maxItems,
      uniqueItems: def.uniqueItems
    });
  }

  get baseType() {
    return 'array';
  }

  get storedType() {
    return (this.items && this.items.storedType) || 'any';
  }

  get items() {
    return this.attributes.items;
  }

  set items(v) {
    if (v && !(v instanceof AnyType))
      v = this._library.get(v);
    this.attributes.items = v == null ? v : v;
  }

  get minItems() {
    return this.attributes.minItems;
  }

  set minItems(v) {
    this.attributes.minItems = v == null ? v : (parseInt(v, 10) || 0);
  }

  get maxItems() {
    return this.attributes.maxItems;
  }

  set maxItems(v) {
    this.attributes.maxItems = v == null ? v : (parseInt(v, 10) || 0);
  }

  get uniqueItems() {
    return this.attributes.uniqueItems;
  }

  set uniqueItems(v) {
    this.attributes.uniqueItems = v == null ? v : !!v;
  }

  _copyTo(target, overwrite) {
    let minItems = target.minItems;
    if (this.minItems != null) {
      minItems = overwrite || minItems == null ?
          this.minItems :
          Math.min(minItems, this.minItems);
    }

    let maxItems = target.maxItems;
    if (this.maxItems != null) {
      maxItems = overwrite || maxItems == null ?
          this.maxItems :
          Math.max(maxItems, this.maxItems);
    }

    super._copyTo(target, overwrite);

    if (minItems != null)
      target.minItems = minItems;
    if (maxItems != null)
      target.maxItems = maxItems;
  }

  _generateValidationCode(options) {
    const data = super._generateValidationCode(options);
    const minItems = this.minItems || 0;
    const maxItems = this.maxItems || 0;
    const {strictTypes} = options;
    const maxErrors = options.maxArrayErrors;
    const uniqueItems = this.uniqueItems;
    const itemsValidator = data.variables.itemsValidator =
        this.items && this.items._generateValidateFunction(options);
    if (strictTypes)
      data.code += `
    if (!Array.isArray(value)) {
        error({
            message: 'Value must be an array',
            errorType: 'invalid-data-type',
            path
        });
        return;
    }`;
    data.code += `
    const arr = Array.isArray(value) ? value : [value];`;
    if (this.attributes.minItems)
      data.code += `
    if (arr.length < ${minItems}) {
        error({
            message: 'Minimum accepted array length is ${minItems}, actual ' + arr.length,
            errorType: 'invalid-value-length',
            path,                
            min: ${minItems}${maxItems ? ', max: ' + maxItems : ''},                
            actual: arr.length
        });
        return;
    }`;
    if (maxItems) {
      data.code += `
    if (arr.length > ${maxItems}) {
        error({
            message: 'Maximum accepted array length is ${maxItems}, actual ' + arr.length,
            errorType: 'invalid-value-length',
            path,
            ${minItems ? 'min: ' + minItems + ', ' : ''}max: ${maxItems},               
            actual: arr.length
        });
        return;
    }`;
    }
    const forIterator = itemsValidator || uniqueItems;
    if (forIterator) {
      data.code += `    
    const itemsLen = arr.length;
    ${itemsValidator && options.coerceTypes ? `
    let numErrors = 0;
    const resultArray = [];
    const lookupArray = resultArray;` : `
    const lookupArray = arr;`}
    
    for (let i = 0; i < itemsLen; i++) {
      ${itemsValidator ? `
        const v = itemsValidator(arr[i], path + '[' + i + ']', error);
        if (v === undefined) {
          ${maxErrors > 1 ? 'if (++numErrors >= maxErrors) return;' : 'return;'}
        }
      ` : 'const v = arr[i];'}
    `;
      if (uniqueItems)
        data.code += `
        if (lookupArray.indexOf(v, i+1) >= 0) {
            error({
                message: 'Unique array contains non-unique items (' + arr[i] + ')',
                errorType: 'unique-item-error',
                path:  path + '[' + i + ']'                                  
            });
            return;
        }`;
      data.code += `
        ${itemsValidator && options.coerceTypes ? 'resultArray.push(v);' : ''}
    }`;
    }
    if (options.coerceTypes)
      data.code += `            
    ${itemsValidator ? 'value = resultArray;' : 'value = arr'}`;
    return data;
  }
}

module.exports = ArrayType;
