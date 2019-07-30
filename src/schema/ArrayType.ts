import Type, {ICoerceOptions} from './Type';
import * as spec10 from "../spec10";
import {ValidationError} from "../ValidationError";

export default class ArrayType extends Type {

    public uniqueItems?: boolean;
    public minItems?: number = 0;
    public maxItems?: number = 2147483647;
    public items?: Type[];

    get baseType() {
        return 'array';
    }

    mix(src: ArrayType | spec10.ArrayTypeDeclaration) {
        super.mix(src);
        this._copyProperties(src, ['uniqueItems', 'minItems', 'maxItems']);
        if (Array.isArray(src.items)) {
            this.items = [];
            for (const typ of src.items) {
                if (typ instanceof Type)
                    this.items.push(typ);
                else
                    this.items.push(this.library.getType(typ));
            }
        }
    }

    protected _getJSCoercer() {
        const {uniqueItems, minItems, maxItems, items} = this;
        const itemCoercers = items && items.map(x => x.getJSCoercer());
        const coercersLen = itemCoercers && itemCoercers.length;

        return (arr: any, options?: ICoerceOptions) => {
            const location = (options && options.location) || '';
            if (options && options.strictTypes && !Array.isArray(arr))
                throw new ValidationError(
                    `Value must be an array`, 'Type error', location);

            if (!Array.isArray(arr)) arr = [arr];

            if (minItems && arr.length < minItems)
                throw new ValidationError(
                    `Minimum accepted array length is ${minItems}, actual${arr.length}`,
                    'Array length out of range error', location);
            if (maxItems && arr.length > maxItems)
                throw new ValidationError(
                    `Maximum accepted array length is ${maxItems}, actual ${arr.length}`,
                    'Array length out of range error', location);
            if (!itemCoercers)
                return arr;

            const resultArray = [];
            let k = 0;
            const tryCoercersOptions = {
                ...options,
                strictTypes: true
            };
            const tryCoercers = (v, index) => {
                // Try with strict types
                let y = coercersLen;
                while (y--) {
                    try {
                        return itemCoercers[k](v, tryCoercersOptions);
                    } catch (e) {
                        k++;
                        if (k >= coercersLen)
                            k = 0;
                    }
                }
                // Try without strict types
                if (!(options && options.strictTypes)) {
                    for (let t = 0; t < coercersLen; t++) {
                        try {
                            return itemCoercers[t](v, options);
                        } catch (e) {
                            //
                        }
                    }
                }
                throw new ValidationError(
                    `Value does not match any of allowed item types`,
                    'Type error', location + '[' + index + ']');
            };
            const itemsLen = arr.length;
            for (let i = 0; i < itemsLen; i++) {
                const v = tryCoercers(arr[i], i);
                if (!(uniqueItems && resultArray.includes(v)))
                    resultArray.push(v);
            }
            return resultArray;
        };
    }

    protected _getJSONCoercer() {
        return this._getJSCoercer();
    }

}
