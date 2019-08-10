import AnyType, {InternalValidateFunction, IValidateOptions, IValidateRules, LogFunction} from './AnyType';
import * as spec10 from "../spec10";

export default class NilType extends AnyType {

    get baseType(): string {
        return 'nil';
    }

    get typeFamily(): string {
        return 'scalar';
    }

    extend(decl: spec10.TypeDeclaration): NilType {
        decl.required = false;
        if (decl.default !== undefined)
            decl.default = null;
        return super.extend(decl) as NilType;
    }

    protected _generateValidator(options: IValidateOptions, rules: IValidateRules = {}): InternalValidateFunction {
        const superValidate = super._generateValidator(options, rules);
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
