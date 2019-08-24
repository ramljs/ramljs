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

const BuiltinFacets = ['name', 'displayName', 'description', 'default', 'required', 'examples', 'example'];

export default class AnyType {
    protected _library: TypeLibrary;
    public annotations: { [index: string]: any };
    public facets: { [index: string]: AnyType };
    public name: string;
    public type: AnyType[];
    public values: { [index: string]: any };

    constructor(library?: TypeLibrary, decl?: spec10.TypeDeclaration) {
        if (!decl.name)
            throw new Error('You must provide "decl.name" property');

        if (decl.examples && decl.example)
            throw new Error('Can\'t use "example" and "examples" facets at same time');

        this._definePrivate('_library', library);
        this.type = [];
        if (decl.type) {
            const types = Array.isArray(decl.type) ? decl.type : [decl.type];
            for (const n of types) {
                const t = library.getType(n);
                if (this.storedType !== t.storedType)
                    throw new TypeError(`Can't extend ${this.storedType} type from ${t.storedType} type`);
                this.type.push(t);
            }
        }
        this.name = decl.name;
        this.annotations = {};
        this.facets = {};
        this.values = {};
        if (decl.annotations) {
            decl.annotations.forEach(x =>
                this.annotations[x.name] = x.value
            );
        }
        if (decl.facets) {
            decl.facets.forEach(x =>
                this.facets[x.name] = library.getType(x)
            );
        }
        BuiltinFacets.forEach(n => {
            if (decl[n] !== undefined)
                this[n] = decl[n];
        });
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

    get displayName() {
        return this.get('displayName');
    }

    set displayName(v) {
        this.set('displayName', v);
    }

    get description() {
        return this.get('description');
    }

    set description(v) {
        this.set('description', v);
    }

    get default() {
        return this.get('default');
    }

    set default(v) {
        this.set('default', v);
    }

    get required() {
        return this.get('required');
    }

    set required(v) {
        this.set('required', v);
    }

    get examples() {
        return this.get('examples');
    }

    set examples(v) {
        this.set('examples', v);
    }

    get example() {
        return this.get('example');
    }

    set example(v) {
        this.set('example', v);
    }

    get(n: string, defaultValue?) {
        if (!this.hasFacet(n))
            throw new Error(`Type ${this.name} has no facet named "${n}"`);
        const x = this.values[n];
        if (x !== undefined)
            return x;
        for (let i = this.type.length - 1; i >= 0; i--) {
            const xx = this.type[i].values[n];
            if (xx) return xx;
        }
        return defaultValue;
    }

    set(n: string, value) {
        if (!this.hasFacet(n))
            throw new Error(`Type ${this.name} has no facet named "${n}"`);
        this.values[n] = value;
    }

    hasFacet(n: string): boolean {
        return !!(BuiltinFacets.includes(n) || this.getUserDefinedFacet(n));
    }

    getUserDefinedFacet(n: string) {
        const x = this.facets[n];
        if (x)
            return x;
        for (let i = this.type.length - 1; i >= 0; i--) {
            const xx = this.type[i].facets[n];
            if (xx) return xx;
        }
    }

    validator(options: IValidateOptions = {}): ValidateFunction {
        const validate = this._generateValidator(options);
        const {allErrors} = options;
        const defVal = this.default;
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
        const data = {code: '', variables: {}};
        if (!(options.ignoreRequired || rules.noRequiredCheck) && this.required) {
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
        data.code += '\n    if (value === null) return value;';
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
