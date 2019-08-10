import AnyType, {InternalValidateFunction, IValidateOptions, LogFunction} from './AnyType';
import * as spec10 from "../spec10";
import UnionType from './UnionType';

export default class ArrayType extends AnyType {

    public uniqueItems?: boolean;
    public minItems?: number = 0;
    public maxItems?: number = 2147483647;
    private items?: AnyType;

    get baseType(): string {
        return 'array';
    }

    get typeFamily(): string {
        return 'array';
    }

    set(src: ArrayType | spec10.ArrayTypeDeclaration) {
        super.set(src);
        this._copyProperties(src, ['uniqueItems', 'minItems', 'maxItems']);
        if (src instanceof ArrayType)
            this.items = src.items;
        else if (Array.isArray(src.items)) {
            this.items = new UnionType(this.library, this.name);
            // @ts-ignore
            this.items.set({
                anyOf: src.items
            });
        }
    }

    hasObjectType() {
        return this.items &&
            (this.items.baseType === 'object' ||
                (this.items.baseType === 'union' &&
                    // @ts-ignore
                    this.items.hasObjectType())
            );
    }

    protected _generateValidator(options: IValidateOptions): InternalValidateFunction {
        const superValidate = super._generateValidator(options);
        const {uniqueItems, minItems, maxItems, items} = this;
        const {strictTypes} = options;
        // @ts-ignore
        const itemsValidator = items && items._generateValidator(options);

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

            if (itemsValidator) {
                const itemsLen = value.length;
                const resultArray = [];
                for (let i = 0; i < itemsLen; i++) {
                    const v = itemsValidator(value[i], path + '[' + i + ']', log);
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
