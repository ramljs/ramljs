import Type, {ICoerceOptions} from './Type';
import * as spec10 from "../spec10";
import {ValidationError} from "../ValidationError";

export default class StringType extends Type {

    public enum?: string[];
    public pattern?: string | string[];
    public minLength?: number;
    public maxLength?: number;

    mix(src: StringType | spec10.StringTypeDeclaration) {
        super.mix(src);
        this._copyProperties(src, ['enum', 'pattern', 'minLength', 'maxLength']);
    }

    get baseType() {
        return 'string';
    }

    protected _getJSCoercer() {
        const minLength = this.minLength || 0;
        const maxLength = this.maxLength || 0;
        const pattern = Array.isArray(this.pattern) ?
            this.pattern.map(x => new RegExp(x)) :
            (this.pattern ? [new RegExp(this.pattern)] : null);
        const patternLen = pattern && pattern.length;
        return (v: any, options?: ICoerceOptions) => {
            if (options && options.strictTypes && typeof v !== 'string')
                throw new ValidationError(
                    `Value must be a string`, 'Type error',
                    (options && options.location));

            v = String(v);
            if (minLength && v.length < minLength)
                throw new ValidationError(
                    `Minimum accepted length is ${minLength}, actual${v.length}`,
                    'Value length out of range error',
                    (options && options.location));
            if (maxLength && v.length > maxLength)
                throw new ValidationError(
                    `Maximum accepted length is ${maxLength}, actual ${v.length}`,
                    'Value length out of range error',
                    (options && options.location));
            if (patternLen) {
                for (let i = 0; i < patternLen; i++) {
                    if (!v.match(pattern[i]))
                        throw new ValidationError(
                            `Value does not match required format "${pattern[i]}"`,
                            'Invalid format error',
                            (options && options.location));
                }
            }
            return v;
        };
    }

    protected _getJSONCoercer() {
        return this._getJSCoercer();
    }

}
