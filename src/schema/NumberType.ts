import Type, {InternalValidateFunction, IValidateOptions, LogFunction} from './Type';
import * as spec10 from "../spec10";

const IntegerTypes = ['int64', 'bigint', 'int32', 'int', 'int16', 'int8',
    'uint64', 'uint32', 'uint16', 'uint8'];

const MinValues = {
    int64: null,
    bigint: null,
    int32: -2147483648,
    int: -9007199254740991,
    int16: -32768,
    int8: -128,
    long: 0,
    uint64: 0,
    uint32: 0,
    uint16: 0,
    uint8: 0,
};

const MaxValues = {
    int64: null,
    bigint: null,
    int32: 2147483647,
    int: 9007199254740991,
    int16: 32767,
    int8: 127,
    long: null,
    uint64: null,
    uint32: 4294967295,
    uint16: 65535,
    uint8: 255,
};

export default class NumberType extends Type {

    public enum?: string[];
    public minimum?: number;
    public maximum?: number;
    public format?: string;
    public multipleOf?: number;

    set(src: NumberType | spec10.NumberTypeDeclaration) {
        super.set(src);
        this._copyProperties(src, ['enum', 'minimum', 'maximum', 'format', 'multipleOf']);
    }

    get baseType() {
        return 'number';
    }

    protected _generateValidateFunction(options: IValidateOptions): InternalValidateFunction {
        const superValidate = super._generateValidateFunction(options);
        const {strictTypes} = options;
        const coerce = options.coerceTypes || options.coerceJSTypes;
        const format = this.format && this.format.toLowerCase();
        const minimum = this.minimum != null ? this.minimum : MinValues[format];
        const maximum = this.maximum != null ? this.maximum : MaxValues[format];
        const multipleOf = this.multipleOf;
        const bigFormat = ['bigint', 'int64', 'uint64', 'long'].includes(format);
        const intFormat = IntegerTypes.includes(format);

        return (value: any, path: string, log?: LogFunction) => {
            value = superValidate(value, path, log);
            if (value == null)
                return value;

            if ((strictTypes && !(typeof value === 'number' || typeof value === 'bigint')) ||
                (value && typeof value === 'object')) {
                log({
                    message: intFormat ? 'Value must be an integer' : 'Value must be a number',
                    errorType: 'TypeError',
                    path
                });
                return;
            }

            let n;
            try {
                n = bigFormat ? BigInt(value) : Number(value);
            } catch (e) {
                log({
                    message: e.message,
                    errorType: 'TypeError',
                    path
                });
            }

            // @ts-ignore
            if (!(typeof n === 'bigint' || !isNaN(n))) {
                log({
                        message: 'Value must be a number or number formatted string',
                        errorType: 'TypeError',
                        path
                    }
                );
                return;
            }

            if (intFormat && typeof n === 'number' && (n - Math.floor(n) > 0)) {
                log({
                        message: intFormat ? 'Value must be an integer' : 'Value must be a number',
                        errorType: 'TypeError',
                        path
                    }
                );
                return;
            }

            if (multipleOf > 0) {
                const c = typeof n === 'bigint' ?
                    n / BigInt(multipleOf) * BigInt(multipleOf) :
                    Math.trunc(n / multipleOf) * multipleOf;
                if (n !== c) {
                    log({
                            message: `Numeric value must be multiple of ${multipleOf}`,
                            errorType: 'TypeError',
                            path
                        }
                    );
                    return;
                }
            }

            if (minimum != null && n < minimum) {
                log({
                        message: `Minimum accepted value is ${minimum}, actual ${n}`,
                        errorType: 'range-error',
                        path,
                        range: [minimum, maximum],
                        actual: n
                    }
                );
                return;
            }
            if (maximum != null && n > maximum) {
                log({
                        message: `Maximum accepted value is ${maximum}, actual ${n}`,
                        errorType: 'range-error',
                        path,
                        range: [minimum, maximum],
                        actual: n
                    }
                );
                return;
            }
            return coerce ? n : value;
        };
    }

}
