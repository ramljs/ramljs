'use strict';
const AnyType = require('./AnyType');
const BuiltinFacets = ['uniqueItems', 'minItems', 'maxItems'];

class ArrayType extends AnyType {

  constructor(library, decl) {
    super(library, decl);
    BuiltinFacets.forEach(n => {
      if (decl[n] !== undefined)
        this.set(n, decl[n]);
    });
    if (decl.items) {
      const item = Array.isArray(decl.items) ? decl.items[0] : decl.items;
      let t;
      if (decl.item instanceof AnyType)
        t = item.clone();
      else {
        t = this._library.getType(item);
      }
      this.items = t;
    }
  }

  get baseType() {
    return 'array';
  }

  get typeFamily() {
    return 'array';
  }

  hasFacet(n) {
    return BuiltinFacets.includes(n) || super.hasFacet(n);
  }

  clone() {
    const t = super.clone();
    t.items = this.items.clone();
    return t;
  }

  _mergeOnto(target, overwrite) {
    if (this.attributes.minItems != null) {
      target.attributes.minItems =
          overwrite || target.attributes.minItems == null ?
              this.attributes.minItems :
              Math.min(target.attributes.minItems, this.attributes.minItems);
    }
    if (this.attributes.maxItems != null) {
      target.attributes.maxItems =
          overwrite || target.attributes.maxItems == null ?
              this.attributes.maxItems :
              Math.max(target.attributes.maxItems, this.attributes.maxItems);
    }
    if (overwrite)
      target.items = this.items.clone();
  }

  _generateValidationCode(options) {
    const data = super._generateValidationCode(options);
    const minItems = this.attributes.minItems || 0;
    const maxItems = this.attributes.maxItems || 0;
    const {strictTypes} = options;
    const maxErrors = options.maxArrayErrors;
    const uniqueItems = this.attributes.uniqueItems;
    const itemsValidator = data.variables.itemsValidator =
        // @ts-ignore
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
