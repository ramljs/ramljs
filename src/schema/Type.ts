import * as spec10 from "../spec10";
import {Library} from "./Library";

export interface IValidationError {
    message: string;
    errorType?: string;
    path?: string;

    [index: string]: any;
}

export interface IValidateOptions {
    allErrors?: boolean;
    strictTypes?: boolean;
    ignoreRequired?: boolean;
    coerceTypes?: boolean;
    coerceJSTypes?: boolean;
    removeAdditional?: boolean | 'all';
    fastDateValidation?: boolean;
}

export type ValidateFunction = (value: any) => void;
export type LogFunction = (err: IValidationError) => void;

export type InternalValidateFunction =
    (v: any, path: string, error: LogFunction) => any;

export class ValidationError extends Error {
}

export default class Type {
    public library: Library;
    public name: string;
    public required?: boolean;
    public default?: any;
    public annotations: { [index: string]: any };

    constructor(library: Library, name: string) {
        this.library = library;
        this.name = name;
    }

    get baseType() {
        return null;
    }

    set(src: Type | spec10.TypeDeclaration) {
        if (src.required !== undefined)
            this.required = src.required;
        if (src.default !== undefined)
            this.default = src.default;
        if (Array.isArray(src.annotations)) {
            this.annotations = this.annotations || {};
            src.annotations.forEach(x => {
                this.annotations[x.name] = x.value;
            });
        }
    }

    validator(options: IValidateOptions = {}): ValidateFunction {
        const validate = this._generateValidateFunction(options);
        const {allErrors} = options;
        return (value: any) => {
            const errors = [];
            const log = (e: IValidationError) => {
                errors.push(e);
                if (!allErrors) {
                    const err = new ValidationError(errors[0].message);
                    // @ts-ignore
                    err.errors = errors;
                    throw err;
                }
            };
            return validate(value != null ? value :
                (this.default != null ? this.default : null), '', log);
        };
    }

    extend(name) {
        const clz = Object.getPrototypeOf(this).constructor;
        const inst = new clz(this.library, name);
        inst.set(this);
        return inst;
    }

    protected _generateValidateFunction(options: IValidateOptions): InternalValidateFunction {
        const required = this.required && !options.ignoreRequired;
        return (value: any, path: string, log?: LogFunction) => {
            if (required && value == null) {
                log({
                    message: 'Value required',
                    errorType: 'ValueRequiredError',
                    path
                });
                return;
            }
            return value;
        };
    }

    protected _copyProperties(src, properties) {
        properties.forEach(x => {
            if (src[x] === null)
                delete this[x];
            else if (src[x] !== undefined)
                this[x] = src[x];
        });
    }

}
