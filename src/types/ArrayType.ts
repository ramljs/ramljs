import AnyType, {
    IValidatorGenerateOptions,
    IFunctionData
} from './AnyType';
import * as spec10 from '../spec10';
import {TypeLibrary} from "./TypeLibrary";

const BuiltinFacets = ['uniqueItems', 'minItems', 'maxItems'];

export default class ArrayType extends AnyType {

    public items?: AnyType;

    constructor(library?: TypeLibrary, decl?: spec10.ArrayTypeDeclaration) {
        super(library, decl);
        BuiltinFacets.forEach(n => {
            if (decl[n] !== undefined)
                this.set(n, decl[n]);
        });
        if (decl.items) {
            this.items = library.getType(
                Array.isArray(decl.items) ? decl.items[0] : decl.items);
        }
    }

    get baseType(): string {
        return 'array';
    }

    get typeFamily(): string {
        return 'array';
    }

    hasFacet(n: string): boolean {
        return BuiltinFacets.includes(n) || super.hasFacet(n);
    }

    clone(): ArrayType {
        const t = super.clone() as ArrayType;
        t.items = this.items.clone();
        return t;
    }

    mergeOnto(target: ArrayType, overwrite?: boolean) {
        if (this.attributes.minItems != null) {
            target.attributes.minItems = target.attributes.minItems != null ?
                Math.min(target.attributes.minItems, this.attributes.minItems) :
                this.attributes.minItems;
        }
        if (this.attributes.maxItems != null) {
            target.attributes.maxItems = target.attributes.maxItems != null ?
                Math.max(target.attributes.maxItems, this.attributes.maxItems) :
                this.attributes.maxItems;
        }
        if (overwrite) {
            target.items = this.items.clone();
            BuiltinFacets.forEach(n => {
                if (this.attributes[n] !== undefined)
                    target.attributes[n] = this.attributes[n];
            });
        }
    }

    protected _generateValidationCode(options: IValidatorGenerateOptions): IFunctionData {
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
            errorType: 'TypeError',
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
            errorType: 'RangeError',
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
            errorType: 'RangeError',
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
    let errorCount = 0;
    const resultArray = [];
    const lookupArray = resultArray;` : `
    const lookupArray = arr;`}
    
    for (let i = 0; i < itemsLen; i++) {
      ${itemsValidator ? `
        const v = itemsValidator(arr[i], path + '[' + i + ']', error);
        if (v === undefined) {
          ${maxErrors > 1 ? 'if (++errorCount >= maxErrors) return;' : 'return;'}
        }
      ` : 'const v = arr[i];'}
    `;

            if (uniqueItems)
                data.code += `
        if (lookupArray.indexOf(v, i+1) >= 0) {
            error({
                message: 'Unique array contains non unique items (' + arr[i] + ')',
                errorType: 'RangeError',
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
