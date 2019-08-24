import AnyType, {
    IFunctionData,
    IValidateOptions,
    IValidateRules,
} from './AnyType';
import * as spec10 from "../spec10";
import {TypeLibrary} from "./TypeLibrary";

export default class NilType extends AnyType {

    constructor(library?: TypeLibrary, decl?: spec10.TypeDeclaration) {
        decl.required = undefined;
        decl.default = undefined;
        super(library, decl);
    }

    get baseType(): string {
        return 'nil';
    }

    get typeFamily(): string {
        return 'scalar';
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
