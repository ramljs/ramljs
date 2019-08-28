import AnyType, {
    IFunctionData,
    IValidatorGenerateOptions
} from './AnyType';
import * as spec10 from '../spec10';
import {TypeLibrary} from './TypeLibrary';

export default class DateType extends AnyType {

    constructor(library?: TypeLibrary, decl?: spec10.DateTypeDeclaration) {
        super(library, decl);
    }

    get baseType(): string {
        return 'date';
    }

    get typeFamily(): string {
        return 'scalar';
    }

    protected _generateValidationCode(options: IValidatorGenerateOptions): IFunctionData {
        const data = super._generateValidationCode(options);
        const coerceTypes = options.coerceTypes;
        const coerceJSTypes = options.coerceJSTypes;
        const fastDateValidation = options.fastDateValidation && !coerceJSTypes;
        const baseType = this.baseType;
        const rfc2616 = this.attributes.format === 'rfc2616';
        const matchDatePattern = this._matchDatePattern(options.strictTypes);
        const dateItemsToISO = this._dateItemsToISO();
        const formatDate = this._formatDate();
        const formatDateItems = this._formatDateItems();

        data.code += `
    if (!(value instanceof Date || typeof value === 'string')) {
        error({
            message: 'Value must be a ${baseType} formatted string or Date instance',
            errorType: 'TypeError',
            path
        });
        return;
    }`;

        data.code += `
    let d = value instanceof Date ? value : undefined;
    let m;    
    if (typeof value === 'string') {`;
        if (rfc2616) data.code += `        
        d = new Date(value);`;
        else data.code += `       
        m = matchDatePattern(value);
        if (!m) {
            error({
                message: 'Value must be a ${baseType} formatted string or Date instance',
                errorType: 'TypeError',
                path
            });
            return;
        }
        ` + (fastDateValidation ?
            `return ${coerceTypes ? 'formatDateItems(m)' : 'value'};` :
            `d = new Date(dateItemsToISO(m));
        d = isValidDate(d) && fastParseInt(m[3]) === d.getUTCDate() ? d : null;`) + `                                     
    }    
`;
        data.code += `
    if (!isValidDate(d)) {
        error({
            message: 'Value must be a ${baseType} formatted string or Date instance',
            errorType: 'TypeError',
            path
        });
        return;
    }`;

        if (coerceJSTypes)
            data.code += '\n    value = d;';
        else if (coerceTypes)
            data.code += '\n    value = m ? formatDateItems(m) : formatDate(d);';

        data.variables = {
            ...data.variables,
            isValidDate,
            matchDatePattern, formatDateItems, formatDate,
            dateItemsToISO, fastParseInt
        };
        return data;
    }

    protected _formatDate() {
        return (d: Date) => d.toISOString();
    }

    protected _formatDateItems() {
        const dateItemsToISO = this._dateItemsToISO();
        return (m: string[]) => dateItemsToISO(m);
    }

    // noinspection JSMethodCanBeStatic
    protected _dateItemsToISO() {
        return (m: string[]) =>
            m[1] + '-' + m[2] + '-' + m[3] +
            // Time
            'T' + (m[4] || '00') + ':' + (m[5] || '00') + ':' + (m[6] || '00') +
            // Millisecond
            (m[7] ? '.' + m[7] : '') +
            // Time zone
            (m[9] ? (m[9] + (m[10] || '00') + ':' + (m[11] || '00')) : 'Z');
    }

    protected _matchDatePattern(strictTypes?: boolean) {
        const PATTERN = /^(\d{4})-(0[1-9]|1[012])-([123]0|[012][1-9]|31)(?:T([01][0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?)?(?:\.?(\d+))?(?:(Z)|(?:([+-])([01]?[0-9]|2[0-3]):?([0-5][0-9])?))?$/;
        return (v: string) => {
            const m = v.match(PATTERN);
            if (m && m[2] === '02' && m[3] > '29')
                return;
            return m;
        };
    }

}

export function isValidDate(d: Date | void) {
    return d && !isNaN(d.getTime());
}

function fastParseInt(str) {
    const strLength = str.length;
    let res = 0;
    let i = 0;
    do {
        const charCode = str.charCodeAt(i);
        if (charCode < 48 || charCode > 57)
            return NaN;
        res *= 10;
        res += (charCode - 48);
    } while (++i < strLength);
    return res;
}
