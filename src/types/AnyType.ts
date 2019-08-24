import * as spec10 from "../spec10";
import {TypeLibrary} from "./TypeLibrary";

export interface IValidationError {
    message: string;
    errorType?: string;
    path?: string;

    [index: string]: any;
}

export interface IValidateOptions {
    allErrors?: boolean;
    strictTypes?: boolean;
    coerceTypes?: boolean;
    coerceJSTypes?: boolean;
    removeAdditional?: boolean | 'all';
    fastDateValidation?: boolean;
    fastObjectValidation?: boolean;
    ignoreRequired?: boolean;
}

export interface IValidateRules {
    noRequiredCheck?: boolean;
    noTypeCheck?: boolean;
    string?: {
        noEnumCheck?: boolean;
        noMinLengthCheck?: boolean;
        noMaxLengthCheck?: boolean;
        noPatternCheck?: boolean;
    };
    number?: {
        noEnumCheck?: boolean;
        noFormatCheck?: boolean;
        noMinimumCheck?: boolean;
        noMaximumCheck?: boolean;
        noMultipleOf?: boolean;
    };
    object?: {
        noDiscriminatorCheck?: boolean;
        noMinPropertiesCheck?: boolean;
        noMaxPropertiesCheck?: boolean;
        noAdditionalPropertiesCheck?: boolean;
    };
    date?: {
        fastDateValidation?: boolean;
    };
}

export interface IFunctionData {
    code: string;
    variables?: { [index: string]: any };
}

export type ValidateFunction = (value: any) => void;
export type LogFunction = (err: IValidationError) => void;

export type InternalValidateFunction =
    (v: any, path: string, error: LogFunction, ...args: any) => any;

export class ValidationError extends Error {
}

export default class AnyType {
    protected _library: TypeLibrary;
    protected _successors: AnyType[];
    public type: Array<string | spec10.TypeDeclaration>;
    public name: string;
    public displayName: string;
    public description: string;
    public example: any;
    public examples: any[];
    public required: string;
    public default: any;
    public annotations: { [index: string]: any };
    public facets: { [index: string]: AnyType };

    constructor(library: TypeLibrary, name: string) {
        if (!name)
            throw new Error('You must provide "name" argument');
        this._definePrivate('_library', library);
        this._definePrivate('_successors', []);
        this.type = [this.baseType];
        this.name = name;
        this.displayName = undefined;
        this.description = undefined;
        this.example = undefined;
        this.examples = undefined;
        this.required = undefined;
        this.default = undefined;
        this.annotations = {};
        this.facets = {};
    }

    get library() {
        return this._library;
    }

    getFacet(n: string, defaultValue?) {
        let x: any;
        /*
         * a required property in the parent type cannot be changed to optional in the sub-type
         */
        if (n === 'required') {
            const l = this._successors.length;
            for (let i = 0; i < l; i++) {
                x = this._successors[i].getFacet(n);
                if (x) return x;
            }
            return this.required;
        }
        x = this.hasOwnProperty(n) ? this[n] : this.facets[n];
        if (x !== undefined)
            return x;
        for (let i = this._successors.length - 1; i >= 0; i--) {
            x = this._successors[i].getFacet(n);
            if (x !== undefined)
                return x;
        }
        return defaultValue;
    }

    get typeFamily(): string {
        return 'any';
    }

    get baseType(): string {
        return 'any';
    }

    get storedType(): string {
        return this.baseType;
    }

    extend(decl: spec10.TypeDeclaration): AnyType {
        if (decl.examples && decl.example)
            throw new Error('Can\'t use "example" and "examples" facets at same time');

        const clz = Object.getPrototypeOf(this).constructor;
        const inst = new clz(this.library, decl.name);
        if (decl.type) {
            const types = Array.isArray(decl.type) ? decl.type : [decl.type];
            for (const n of types) {
                if (n !== this.baseType) {
                    const t = this.library.getType(n);
                    if (inst.storedType !== t.storedType)
                        throw new TypeError(`Can't extend ${inst.storedType} type from ${t.storedType} type`);
                    inst._successors.push(t);
                }
            }
        }
        inst.type = Array.isArray(decl.type) ? decl.type : [decl.type];
        ['displayName', 'description', 'default', 'required', 'examples', 'example'].forEach(n => {
            if (decl[n] !== undefined)
                inst[n] = decl[n];
        });
        if (decl.annotations) {
            decl.annotations.forEach(x => {
                inst.annotations[x.name] = x.value;
            });
        }
        if (decl.facets) {
            decl.facets.forEach(x => {
                inst.facets[x.name] = this.library.getType(x);
            });
        }
        return inst;
    }

    validator(options: IValidateOptions = {}): ValidateFunction {
        const validate = this._generateValidator(options);
        const {allErrors} = options;
        const defVal = this.getFacet('default');
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
            const v = validate(value != null ? value :
                (defVal != null ? defVal : null), '', log);
            if (errors.length) {
                const err = new ValidationError(errors[0].message);
                // @ts-ignore
                err.errors = errors;
                throw err;
            }
            return v !== undefined ? v : value;
        };
    }

    protected _generateValidateBody(options: IValidateOptions, rules: IValidateRules = {}): IFunctionData {
        const data = {code: '\nif (value === null) return value;', variables: {}};
        if (!(options.ignoreRequired || rules.noRequiredCheck) && this.getFacet('required')) {
            data.code += `     
    if (value == null) {
        log({
            message: 'Value required',
            errorType: 'ValueRequiredError',
            path
        });
        return;
    }
`;
        }
        return data;
    }

    protected _generateValidator(options: IValidateOptions, rules: IValidateRules = {}): InternalValidateFunction {
        const o = this._generateValidateBody(options, rules) || {code: ''};
        const code = 'return (value, path, log, context) => {' + o.code + '\n    return value;\n}';
        const varNames = [];
        const varValues = [];
        if (o.variables)
            for (const n of Object.keys(o.variables)) {
                varNames.push(n);
                varValues.push(o.variables[n]);
            }
        const fn = new Function(...varNames, code);
        return fn(...varValues);
    }

    protected _definePrivate(n: string, v: any) {
        Object.defineProperty(this, n, {
            enumerable: false,
            value: v
        });
    }

}
