import Type, {LogFunction, InternalValidateFunction, IValidateOptions} from './Type';

export default class BooleanType extends Type {

    get baseType() {
        return 'boolean';
    }

    protected _generateValidateFunction(options: IValidateOptions): InternalValidateFunction {
        const superValidate = super._generateValidateFunction(options);
        const {strictTypes} = options;
        const coerce = options.coerceTypes || options.coerceJSTypes;
        return (value: any, path: string, log?: LogFunction) => {
            value = superValidate(value, path, log);
            if (value == null)
                return value;
            if ((strictTypes && typeof value !== 'boolean') ||
                (value && typeof value === 'object')) {
                log({
                    message: 'Value must be a boolean',
                    errorType: 'TypeError',
                    path
                });
                return;
            }
            return coerce ? !!value : value;
        };
    }

}
