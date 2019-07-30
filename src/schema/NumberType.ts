import Type, {ICoerceOptions} from './Type';
import * as spec10 from "../spec10";
import {ValidationError} from "../ValidationError";

const MinValues = {
    int64: null,
    bigint: null,
    int32: -Math.pow(2, 32) / 2,
    int: -Math.pow(2, 32) / 2,
    int16: -Math.pow(2, 16) / 2,
    int8: -Math.pow(2, 8) / 2,
    long: 0,
    uint64: 0,
    uint32: 0,
    uint16: 0,
    uint8: 0,
};

const MaxValues = {
    int64: null,
    bigint: null,
    int32: Math.pow(2, 32) / 2 - 1,
    int: Math.pow(2, 32) / 2 - 1,
    int16: Math.pow(2, 16) / 2 - 1,
    int8: Math.pow(2, 8) / 2 - 1,
    long: null,
    uint64: null,
    uint32: Math.pow(2, 32) - 1,
    uint16: Math.pow(2, 16) - 1,
    uint8: Math.pow(2, 8) - 1,
};

const IntegerTypes = ['int64', 'bigint', 'int32', 'int', 'int16', 'int8',
    'uint64', 'uint32', 'uint16', 'uint8'];

export default class NumberType extends Type {

    public enum?: string[];
    public minimum?: number;
    public maximum?: number;
    public format?: string;
    public multipleOf?: number;

    mix(src: NumberType | spec10.NumberTypeDeclaration) {
        super.mix(src);
        this._copyProperties(src, ['enum', 'minimum', 'maximum', 'format', 'multipleOf']);
    }

    get baseType() {
        return 'number';
    }

    _getJSCoercer() {
        const format = this.format && this.format.toLowerCase();
        const minimum = this.minimum != null ? this.minimum : MinValues[format];
        const maximum = this.maximum != null ? this.maximum : MaxValues[format];
        const multipleOf = this.multipleOf;
        const bigFormat = ['bigint', 'int64', 'uint64', 'long'].includes(format);
        return (v: number, options?: ICoerceOptions) => {
            if ((options && options.strictTypes &&
                !(typeof v === 'number' || typeof v === 'bigint')) ||
                (IntegerTypes.includes(format) && (v - Math.floor(v) > 0))
            ) throw new ValidationError(
                `Value must be a number`, 'Type error',
                (options && options.location));

            let n: number | bigint = Number(v);
            if (isNaN(v))
                throw new ValidationError(
                    `Value is not a number`, 'Value format error',
                    (options && options.location));
            if (bigFormat) {
                const b = BigInt(v);
                // @ts-ignore
                // tslint:disable-next-line
                n = b == n ? n : b;
            }

            if (multipleOf > 0) {
                const c = typeof n === 'bigint' ?
                    n / BigInt(multipleOf) * BigInt(multipleOf) :
                    Math.trunc(n / multipleOf) * multipleOf;
                if (n !== c)
                    throw new ValidationError(
                        `Numeric value must be multiple of ${multipleOf}`,
                        'Numeric value multiplicity error',
                        (options && options.location));
            }

            if (minimum != null && n < minimum) {
                throw new ValidationError(
                    `Minimum accepted value is ${minimum}, actual ${n}`,
                    'Numeric value out of range error',
                    (options && options.location));
            }
            if (maximum != null && n > maximum) {
                throw new ValidationError(
                    `Maximum accepted value is ${maximum}, actual ${n}`,
                    'Numeric value out of range error',
                    (options && options.location));
            }
            return n;
        };
    }

    protected _getJSONCoercer() {
        const coercer = this._getJSCoercer();
        return (v) => {
            const x = coercer(v);
            return typeof x === 'bigint' ? String(x) : x;
        };
    }

}
