import AnyType, {
    IValidatorGenerateOptions,
    IFunctionData
} from './AnyType';

export default class BooleanType extends AnyType {

    get baseType(): string {
        return 'boolean';
    }

    get typeFamily(): string {
        return 'scalar';
    }

    protected _generateValidationCode(options: IValidatorGenerateOptions): IFunctionData {
        const data = super._generateValidationCode(options);
        const {strictTypes} = options;
        const coerce = options.coerceTypes || options.coerceJSTypes;
        data.code += `
            if (!(typeof value === 'boolean'`;
        if (!strictTypes)
            data.code += ` || (value === 0 || value === 1 || value === 'false' || value === 'true')`;
        data.code += `)
            ) {
                error({
                    message: 'Value must be a boolean',
                    errorType: 'TypeError',
                    path
                });
                return;
            }            
`;
        if (coerce && !strictTypes)
            data.code += '\n    value = value === \'false\' ? false : !!value';
        return data;
    }

}
