import Type, {LogFunction, InternalValidateFunction, IValidateOptions} from './Type';
import * as spec10 from "../spec10";

export default class StringType extends Type {

    public enum?: string[];
    public pattern?: string | string[];
    public minLength?: number;
    public maxLength?: number;

    set(src: StringType | spec10.StringTypeDeclaration) {
        super.set(src);
        this._copyProperties(src, ['enum', 'pattern', 'minLength', 'maxLength']);
    }

    get baseType() {
        return 'string';
    }

    protected _generateValidateFunction(options: IValidateOptions): InternalValidateFunction {
        const superValidate = super._generateValidateFunction(options);
        const {strictTypes} = options;
        const coerce = options.coerceTypes || options.coerceJSTypes;
        const minLength = this.minLength || 0;
        const maxLength = this.maxLength || 0;
        const pattern = Array.isArray(this.pattern) ?
            this.pattern.map(x => new RegExp(x)) :
            (this.pattern ? [new RegExp(this.pattern)] : null);
        const patternLen = pattern && pattern.length;

        return (value: any, path: string, log?: LogFunction) => {
            value = superValidate(value, path, log);
            if (value == null)
                return value;
            if ((strictTypes && typeof value !== 'string') ||
                (value && typeof value === 'object')) {
                log({
                    message: 'Value must be a string',
                    errorType: 'TypeError',
                    path
                });
                return;
            }

            const v = String(value);
            // Validate min length
            if (minLength && v.length < minLength) {
                log({
                        message: `Minimum accepted length is ${minLength}, actual ${v.length}`,
                        errorType: 'RangeError',
                        path,
                        range: [minLength, maxLength],
                        actual: value.length
                    }
                );
            }

            // Validate max length
            if (maxLength && v.length > maxLength) {
                log({
                        message: `Maximum accepted length is ${maxLength}, actual ${v.length}`,
                        errorType: 'RangeError',
                        path,
                        range: [minLength, maxLength],
                        actual: value.length
                    }
                );
            }

            // Validate patterns
            if (patternLen) {
                let matched;
                for (let i = 0; i < patternLen; i++) {
                    if (v.match(pattern[i])) {
                        matched = true;
                        break;
                    }

                }
                if (!matched) {
                    log({
                            message: `Value does not match required format`,
                            errorType: 'format-error',
                            path
                        }
                    );
                    return;
                }
            }

            return coerce ? v : value;
        };
    }

}
