import AnyType, {
    IFunctionData,
    IValidatorGenerateOptions,
} from './AnyType';
import * as spec10 from '../spec10';
import {TypeLibrary} from './TypeLibrary';

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

    protected _generateValidationCode(options: IValidatorGenerateOptions): IFunctionData {
        const data = super._generateValidationCode(options);
        data.code += `
    error({
        message: 'Value must be null',
        errorType: 'TypeError',
        path
    });
    return;        
        `;
        return data;
    }

}
