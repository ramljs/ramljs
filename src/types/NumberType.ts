import AnyType, {InternalValidateFunction, IValidateOptions, IValidateRules, LogFunction} from './AnyType';
import * as spec10 from "../spec10";
import {TypeLibrary} from "./TypeLibrary";

const IntegerTypes = ['int64', 'bigint', 'int32', 'int', 'int16', 'int8',
    'uint64', 'uint32', 'uint16', 'uint8'];

const MinValues = {
    int64: null,
    bigint: null,
    int32: -2147483648,
    int: -9007199254740991,
    int16: -32768,
    int8: -128,
    long: 0,
    uint64: 0,
    uint32: 0,
    uint16: 0,
    uint8: 0,
};

const MaxValues = {
    int64: null,
    bigint: null,
    int32: 2147483647,
    int: 9007199254740991,
    int16: 32767,
    int8: 127,
    long: null,
    uint64: null,
    uint32: 4294967295,
    uint16: 65535,
    uint8: 255,
};

export default class NumberType extends AnyType {

    public enum: number[];
    public minimum?: number;
    public maximum?: number;
    public format?: string;
    public multipleOf?: number;

    constructor(library: TypeLibrary, name: string) {
        super(library, name);
        this.enum = undefined;
        this.minimum = undefined;
        this.maximum = undefined;
        this.format = undefined;
        this.multipleOf = undefined;
    }

    get baseType(): string {
        return 'number';
    }

    get typeFamily(): string {
        return 'scalar';
    }

    extend(decl: spec10.NumberTypeDeclaration): NumberType {
        const inst = super.extend(decl) as NumberType;
        ['enum', 'minimum', 'maximum', 'format', 'multipleOf'].forEach(n => {
            if (decl[n] !== undefined)
                inst[n] = decl[n];
        });
        return inst;
    }

    protected _generateValidator(options: IValidateOptions, rules: IValidateRules = {}): InternalValidateFunction {
        const superValidate = super._generateValidator(options, rules);
        const numRules = rules.number || {};
        const {strictTypes} = options;
        const coerce = options.coerceTypes || options.coerceJSTypes;
        let enums = !numRules.noEnumCheck && this.getFacet('enum');
        if (enums)
            enums = new Set(enums);

        const format = !numRules.noFormatCheck && this.getFacet('format');
        let minimum;
        let maximum;
        if (!numRules.noMinimumCheck) {
            minimum = this.getFacet('minimum');
            minimum = minimum != null ? minimum : MinValues[format];
        }
        if (!numRules.noMaximumCheck) {
            maximum = !numRules.noMaximumCheck && this.getFacet('maximum');
            maximum = maximum != null ? maximum : MaxValues[format];
        }
        const multipleOf = !numRules.noMultipleOf && this.getFacet('multipleOf');

        const bigFormat = ['bigint', 'int64', 'uint64', 'long'].includes(format);
        const intFormat = IntegerTypes.includes(format);
        const errorMsg1 = 'Value must be ' +
            (intFormat ? 'an integer' : 'a number') +
            (strictTypes ? '' : ' or ' +
                (intFormat ? 'integer' : 'number') +
                ' formatted string');

        let code = `        
return (value, path, log, context) => {        
    value = superValidate(value, path, log);
    if (value == null)
        return value;
`;

        if (!rules.noTypeCheck) {
            code += `
    if (!((typeof value === 'number' || typeof value === 'bigint')`;
            if (!strictTypes)
                code += ` || (typeof value === 'string' && value)`;
            code += `)
    ) {
        log({
            message: errorMsg1,
            errorType: 'TypeError',
            path
        });
        return;
    }            
`;
        }

        code += `
    let n;
    try {
        n = ${bigFormat ? 'BigInt(value)' : 'Number(value)'};
    } catch (e) {
        log({
            message: e.message,
            errorType: 'TypeError',
            path
        });
    }

    if (!(typeof n === 'bigint' || !isNaN(n))) {
        log({
                message: errorMsg1,
                errorType: 'TypeError',
                path
            }
        );
        return;
    }
`;

        if (intFormat)
            code += `
    if (typeof n === 'number' && (n - Math.floor(n) > 0)) {
        log({
                message: errorMsg1,
                errorType: 'TypeError',
                path
            }
        );
        return;
    }
`;

        if (enums)
            code += `
    if (!enums.has(n)) {
        log({
            message: 'Value must be a one of enumerated value',
            errorType: 'TypeError',
            path
        });
        return;
    }
`;

        if (multipleOf)
            code += `
    const c = typeof n === 'bigint' ?
        n / BigInt(${multipleOf}) * BigInt(${multipleOf}) :
        Math.trunc(n / ${multipleOf}) * ${multipleOf};
    if (n !== c) {
        log({
                message: 'Numeric value must be multiple of ${multipleOf}',
                errorType: 'TypeError',
                path
            }
        );
        return;
    }
`;

        if (minimum != null)
            code += `
    if (n < ${minimum}) {
        log({
                message: 'Minimum accepted value is ${minimum}, actual ' + n,
                errorType: 'range-error',
                path,
                min: ${minimum}${maximum ? maximum : ', max: ' + maximum},
                actual: n
            }
        );
        return;
    }
`;

        if (maximum)
            code += `
    if (n > ${maximum}) {
        log({
                message: 'Maximum accepted value is ${maximum}, actual ' + n,
                errorType: 'range-error',
                path,
                ${minimum ? 'min: ' + minimum + ', ' : ''}max: ${maximum},
                actual: n
            }
        );
        return;
    }
`;

        code += `
    return ${coerce ? 'n' : 'value'};\n}`;

        const fn = new Function('superValidate', 'enums', 'errorMsg1', code);
        return fn(superValidate, enums, errorMsg1);
    }

}
