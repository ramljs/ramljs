import Type, {InternalValidateFunction, IValidateOptions, LogFunction} from './Type';
import * as spec10 from "../spec10";

export default class NilType extends Type {

    get baseType() {
        return 'nil';
    }

    set(src: Type | spec10.TypeDeclaration) {
        super.set(src);
        this.required = false;
        if (this.default !== undefined)
            this.default = null;
    }

    protected _generateValidateFunction(options: IValidateOptions): InternalValidateFunction {
        const superValidate = super._generateValidateFunction(options);
        const coerce = options.coerceTypes || options.coerceJSTypes;
        return (value: any, path: string, log?: LogFunction) => {
            value = superValidate(value, path, log);
            if (value == null)
                return value;
            log({
                message: 'Value must be null',
                errorType: 'TypeError',
                path
            });
        };
    }

}
