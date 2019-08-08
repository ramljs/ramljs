import Type, {InternalValidateFunction, IValidateOptions, LogFunction} from './Type';
import * as spec10 from "../spec10";
import UnionType from './UnionType';

export default class ArrayType extends Type {

    public uniqueItems?: boolean;
    public minItems?: number = 0;
    public maxItems?: number = 2147483647;
    private _union?: UnionType;

    get baseType() {
        return 'array';
    }

    get items(): Type[] {
        return this._union && this._union.anyOf;
    }

    set(src: ArrayType | spec10.ArrayTypeDeclaration) {
        super.set(src);
        this._copyProperties(src, ['uniqueItems', 'minItems', 'maxItems']);
        if (src instanceof ArrayType)
            this._union = src._union;
        else if (Array.isArray(src.items)) {
            this._union = new UnionType(this.library, this.name);
            // @ts-ignore
            this._union.set({
                anyOf: src.items
            });
        }
    }

    hasObjectType() {
        return this._union && this._union.hasObjectType();
    }

    protected _generateValidateFunction(options: IValidateOptions): InternalValidateFunction {
        const superValidate = super._generateValidateFunction(options);
        const {uniqueItems, minItems, maxItems, items} = this;
        const {strictTypes} = options;
        // @ts-ignore
        const unionValidator = this._union && this._union._generateValidateFunction(options);

        return (value: any, path: string, log?: LogFunction) => {
            value = superValidate(value, path, log);
            if (value == null)
                return value;

            if (strictTypes && !Array.isArray(value)) {
                log({
                        message: 'Value must be an array',
                        errorType: 'TypeError',
                        path
                    }
                );
                return;
            }

            if (!Array.isArray(value)) value = [value];
            let errLen = 0;

            if (unionValidator) {
                const itemsLen = value.length;
                const resultArray = [];
                for (let i = 0; i < itemsLen; i++) {
                    const v = unionValidator(value[i], path + '[' + i + ']', log);
                    if (v === undefined)
                        return;
                    if (!uniqueItems || !resultArray.includes(v))
                        resultArray.push(v);
                }
                value = resultArray;
            }

            if (minItems && value.length < minItems) {
                errLen++;
                log({
                        message: `Minimum accepted array length is ${minItems}, actual ${value.length}`,
                        errorType: 'range-error',
                        path,
                        range: [minItems, maxItems],
                        actual: value.length
                    }
                );
            }
            if (maxItems && value.length > maxItems) {
                errLen++;
                log({
                        message: `Maximum accepted array length is ${maxItems}, actual ${value.length}`,
                        errorType: 'range-error',
                        path,
                        range: [minItems, maxItems],
                        actual: value.length
                    }
                );
            }
            return !errLen ? value : undefined;
        };
    }

}
