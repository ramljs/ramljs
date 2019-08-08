
export interface IValidationError {
    message: string;
    errorType?: string;
    location?: string;
}

export interface IValidatorOptions {
    allErrors?: boolean;
    removeAdditional?: boolean;
    strictTypes?: boolean;
    ignoreRequired?: boolean;
}

export interface ICoerceOptions {
    allErrors?: boolean;
    removeAdditional?: boolean;
    strictTypes?: boolean;
    ignoreRequired?: boolean;
}

export type ValidateFn = (v: any,
                          errors: IValidationError[],
                          location: string,
                          options?: ICoerceOptions) => any;

export class ValidationError extends Error {
}

export class Validator {

    private _validate: ValidateFn;

    constructor(validate: ValidateFn) {
        this._validate = validate;
    }

    toJSON(v: any) {
        this._validate(v,)
        return (value: any, validateOptions?: ICoerceOptions) => {
            const errors = [];
            const v = validate(value, errors, '', validateOptions);
            if (errors.length) {
                const err = new ValidationError(errors[0].message);
                // @ts-ignore
                err.errors = errors;
                throw err;
            }
            return v;
        };
    }

}
