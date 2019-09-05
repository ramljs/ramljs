import * as spec10 from '../spec10';
import TypeLibrary from './TypeLibrary';

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
    variables?: {
        [index: string]: any;
    };
}

export declare type ValidateFunction = (value: any) => IValidateResult;
export declare type LogFunction = (err: IValidationError) => void;
export declare type InternalValidateFunction = (v: any, path: string, error: LogFunction, ...args: any[]) => any;

export default class AnyType {
    protected _library: TypeLibrary;
    type: AnyType[];
    attributes: {
        [index: string]: any;
    };
    annotations: {
        [index: string]: any;
    };
    facets: {
        [index: string]: AnyType;
    };

    constructor(library?: TypeLibrary, decl?: spec10.TypeDeclaration);

    readonly name: any;
    readonly typeFamily: string;
    readonly baseType: string;
    readonly storedType: string;

    clone(): AnyType;

    get(n: string, defaultValue?: any): any;

    set(n: string, value: any): void;

    hasFacet(n: string): boolean;

    getUserDefinedFacet(n: string): AnyType;

    flatten(): AnyType[];

    validator(options?: IValidatorOptions): ValidateFunction;

    protected _mergeOnto(target: AnyType, overwrite?: boolean): void;

    protected _generateValidateFunction(options: IValidatorOptions): InternalValidateFunction;

    protected _generateValidationCode(options: IValidatorGenerateOptions): IFunctionData;
}
