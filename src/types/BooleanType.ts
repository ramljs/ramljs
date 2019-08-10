import AnyType, {LogFunction, InternalValidateFunction, IValidateOptions, IValidateRules} from './AnyType';

export default class BooleanType extends AnyType {

    get baseType(): string {
        return 'boolean';
    }

    get typeFamily(): string {
        return 'scalar';
    }

    protected _generateValidator(options: IValidateOptions, rules: IValidateRules = {}): InternalValidateFunction {
        const superValidate = super._generateValidator(options, rules);
        const {strictTypes} = options;
        const coerce = options.coerceTypes || options.coerceJSTypes;

        let code = `        
return (value, path, log, context) => {        
    value = superValidate(value, path, log);
    if (value == null)
        return value;
`;

        if (!rules.noTypeCheck) {
            code += `
            if (!(typeof value === 'boolean'`;
            if (!strictTypes)
                code += ` || (value === 0 || value === 1 || value === 'false' || value === 'true')`;
            code += `)
            ) {
                log({
                    message: 'Value must be a boolean',
                    errorType: 'TypeError',
                    path
                });
                return;
            }            
`;
        }

        code += `
    return ${coerce && !strictTypes ? 'value === \'false\' ? false : !!value' : 'value'};\n}`;

        const fn = new Function('superValidate', code);
        return fn(superValidate);
    }

}
