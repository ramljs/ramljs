import AnyType, {InternalValidateFunction, IValidateOptions, IValidateRules, LogFunction} from './AnyType';
import * as spec10 from "../spec10";
import {TypeLibrary} from "./TypeLibrary";

export default class DateTimeType extends AnyType {

    public format?: 'rfc3339' | 'rfc2616';

    constructor(library: TypeLibrary, name: string) {
        super(library, name);
        this.format = undefined;
    }

    get baseType(): string {
        return 'datetime';
    }

    get typeFamily(): string {
        return 'scalar';
    }

    extend(decl: spec10.DateTypeDeclaration): DateTimeType {
        const inst = super.extend(decl) as DateTimeType;
        inst.format = decl.format !== undefined ?
            decl.format : this.format;
        return inst;
    }

    protected _generateValidator(options: IValidateOptions, rules: IValidateRules = {}): InternalValidateFunction {
        const superValidate = super._generateValidator(options);
        const dateRules = rules.date || {};
        const coerceTypes = options.coerceTypes;
        const coerceJSTypes = options.coerceJSTypes;
        const fastDateValidation = (options.fastDateValidation || dateRules.fastDateValidation) && !coerceJSTypes;
        const baseType = this.baseType;
        const rfc2616 = this.getFacet('format') === 'rfc2616';
        const matchDatePattern = this._matchDatePattern(options.strictTypes);
        const dateItemsToISO = this._dateItemsToISO();
        const formatDate = this._formatDate();
        const formatDateItems = this._formatDateItems();

        let code = `        
return (value, path, log, context) => {        
    value = superValidate(value, path, log);
    if (value == null)
        return value;
`;

        if (!rules.noTypeCheck) {
            code += `
    if (!(value instanceof Date || typeof value === 'string')) {
        log({
            message: 'Value must be a ${baseType} formatted string or Date instance',
            errorType: 'TypeError',
            path
        });
        return;
    }            
`;
        }

        code += `
    let d = value instanceof Date ? value : undefined;
    let m;    
    if (typeof value === 'string') {`;
        if (rfc2616)
            code += `
        d = new Date(value);`;
        else
            code += `
        m = matchDatePattern(value);
        if (!m) {
            log({
                    message: 'Value must be a ${baseType} formatted string or Date instance',
                    errorType: 'TypeError',
                    path
                }
            );
            return;
        }
        ` + (fastDateValidation ?
                `return ${coerceTypes ? 'formatDateItems(m)' : 'value'};` :
                `d = new Date(dateItemsToISO(m));
        d = isValidDate(d) && fastParseInt(m[3]) === d.getUTCDate() ? d : null;`) + `                                     
    }    
`;

        code += `
    if (!isValidDate(d)) {
        log({
                message: 'Value must be a ${baseType} formatted string or Date instance',
                errorType: 'TypeError',
                path
            }
        );
        return;
    }        
    return ${coerceJSTypes ? 'd' :
            (coerceTypes ? 'm ? formatDateItems(m) : formatDate(d)' : 'value')};\n}`;

        const fn = new Function('superValidate', 'isValidDate', 'matchDatePattern',
            'formatDateItems', 'formatDate', 'dateItemsToISO', 'fastParseInt', code);
        return fn(superValidate, isValidDate,
            matchDatePattern, formatDateItems, formatDate,
            dateItemsToISO, fastParseInt);
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
