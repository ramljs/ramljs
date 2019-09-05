import AnyType, {IFunctionData, IValidatorGenerateOptions} from './AnyType';
import TypeLibrary from './TypeLibrary';
import * as spec10 from '../spec10';

export default class DateType extends AnyType {
    constructor(library?: TypeLibrary, decl?: spec10.DateTypeDeclaration);

    readonly baseType: string;
    readonly typeFamily: string;

    protected _generateValidationCode(options: IValidatorGenerateOptions): IFunctionData;

    protected _formatDate(): (d: Date) => string;

    protected _formatDateItems(): (m: string[]) => string;

    protected _dateItemsToISO(): (m: string[]) => string;

    protected _matchDatePattern(strictTypes?: boolean): (v: string) => RegExpMatchArray;
}

export declare function isValidDate(d: Date | void): boolean;
