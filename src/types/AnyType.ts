import * as spec10 from '../spec10';
import {TypeLibrary} from './TypeLibrary';

export interface IValidationError {
    message: string;
    errorType?: string;
    path?: string;

    [index: string]: any;
}

export interface IValidatorOptions {
    maxObjectErrors?: number;
    maxArrayErrors?: number;
    throwOnError?: boolean;
    strictTypes?: boolean;
    coerceTypes?: boolean;
    coerceJSTypes?: boolean;
    removeAdditional?: boolean | 'all';
    fastDateValidation?: boolean;
    fastObjectValidation?: boolean;
    ignoreRequire?: boolean | string[];
}

export interface IValidatorGenerateOptions extends IValidatorOptions {
    isUnion?: boolean;
}

export interface IValidateResult {
    valid: boolean;
    value?: any;
    errors?: IValidationError[];
}

export interface IFunctionData {
    code: string;
    variables?: { [index: string]: any };
}

export type ValidateFunction = (value: any) => IValidateResult;
export type LogFunction = (err: IValidationError) => void;

export type InternalValidateFunction =
    (v: any, path: string, error: LogFunction, ...args: any) => any;

export class ValidationError extends Error {
}

const BuiltinFacets = ['name', 'displayName', 'description', 'default', 'required', 'examples', 'example'];

export default class AnyType {
    protected _library: TypeLibrary;
    public type: AnyType[];
    public attributes: { [index: string]: any };
    public annotations: { [index: string]: any };
    public facets: { [index: string]: AnyType };

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
                if (t.name !== t.baseType)
                    this.type.push(t);
            }
        }
        this.annotations = {};
        this.facets = {};
        this.attributes = {};
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
                this.set(n, decl[n]);
        });
    }

    get name() {
        return this.attributes.name;
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

    clone(): AnyType {
        const Clazz = Object.getPrototypeOf(this).constructor;
        const t = new Clazz(this._library, {
            name: this.name
        });
        BuiltinFacets.forEach(x => {
            if (this.attributes[x] !== undefined)
                t.attributes[x] = this.attributes[x];
        });
        this.mergeOnto(t, true);
        return t;
    }

    mergeOnto(target: AnyType, overwrite?: boolean) {
        this.type.forEach(t => {
            if (!target.type.find(tt => tt.name === t.name))
                target.type.push(t);
        });
        Object.assign(target.annotations, this.annotations);
        Object.assign(target.facets, this.facets);
    }

    get(n: string, defaultValue?) {
        if (!this.hasFacet(n))
            throw new Error(`Type ${this.name} has no facet named "${n}"`);
        const x = this.attributes[n];
        if (x !== undefined)
            return x;
        for (let i = this.type.length - 1; i >= 0; i--) {
            const xx = this.type[i].attributes[n];
            if (xx) return xx;
        }
        return defaultValue;
    }

    set(n: string, value) {
        if (!this.hasFacet(n))
            throw new Error(`Type ${this.name} has no facet named "${n}"`);
        this.attributes[n] = value;
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

    protected flatten(): AnyType[] {
        if (!this.type.length)
            return [this];
        const combinations = [];
        const Clazz = Object.getPrototypeOf(this).constructor;
        const iterateTypes = (typ, startIdx: number) => {
            for (let i = startIdx; i < this.type.length; i++) {
                const tt = this.type[i];
                const c = tt.flatten();
                for (let l = 0; l < c.length; l++) {
                    let t2;
                    if (l < c.length - 1) {
                        t2 = typ.clone();
                        c[l].mergeOnto(t2, i === 0);
                        iterateTypes(t2, i + 1);
                    } else {
                        c[l].mergeOnto(typ, i === 0);
                    }
                }
            }
            this.mergeOnto(typ, true);
            combinations.push(typ);
            typ.type = [];
            typ.attributes.name += '_' + (combinations.indexOf(typ) + 1);
        };
        const base = new Clazz(this._library, {name: this.name});
        iterateTypes(base, 0);
        return combinations;
    }

    validator(options: IValidatorOptions = {}): ValidateFunction {
        const defaultVal = this.attributes.default;
        const validate = this._generateValidateFunction(options);
        const throwOnError = options.throwOnError;
        return (value: any): IValidateResult => {
            const errors = [];
            const errorFn = (e: IValidationError) => {
                errors.push(e);
            };
            const v = validate(value != null ? value : (defaultVal != null ? defaultVal : null), '', errorFn);
            const valid = v !== undefined;
            if (!valid && !errors.length) {
                errorFn({
                    message: 'Validation failed',
                    errorType: 'ValidationError',
                });
            }
            if (throwOnError && errors.length) {
                const ee = new ValidationError(errors[0].message);
                // @ts-ignore
                ee.errors = errors;
                throw ee;
            }
            return errors.length ? {valid, errors} : {valid, value: v};
        };
    }

    protected _generateValidateFunction(options: IValidatorOptions): InternalValidateFunction {
        const types = this.flatten();
        const functions = [];
        const isUnion = types.length > 1;
        for (const typ of types) {
            const varNames = [];
            const varValues = [];
            const o = typ._generateValidationCode({...options, isUnion});
            if (o.variables)
                for (const n of Object.keys(o.variables)) {
                    varNames.push(n);
                    varValues.push(o.variables[n]);
                }
            const code = `return (value, path, error) => {${o.code}\n    return value;\n}`;
            const fn = new Function(...varNames, code)(...varValues);
            functions.push(fn);
        }
        if (isUnion) {
            return (...arg) => {
                for (const fn of functions) {
                    const v = fn(...arg);
                    if (v !== undefined)
                        return v;
                }
            };
        }
        return functions[0];
    }

    protected _generateValidationCode(options: IValidatorGenerateOptions): IFunctionData {
        const data = {code: '', variables: {}};
        if (this.attributes.required &&
            (options.ignoreRequire !== true ||
                (Array.isArray(options.ignoreRequire) && options.ignoreRequire.includes(this.name))
            )) {
            data.code += `     
    if (value == null) {
        error({
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

    protected _definePrivate(n: string, v: any) {
        Object.defineProperty(this, n, {
            enumerable: false,
            value: v
        });
    }

}
