import AnyType, {
    IFunctionData,
    IValidateOptions,
    IValidateRules,
} from './AnyType';
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

    protected _generateValidateBody(options: IValidateOptions, rules: IValidateRules = {}): IFunctionData {
        const data = super._generateValidateBody(options, rules);
        data.code += `
            log({
                message: 'Value must be null',
                errorType: 'TypeError',
                path
            });        
        `;
        return data;
    }

}
