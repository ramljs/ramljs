import AnyType, {
    IFunctionData,
    IValidatorGenerateOptions,
} from './AnyType';
import * as spec10 from '../spec10';
import {TypeLibrary} from './TypeLibrary';

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

const BuiltinFacets = ['enum', 'minimum', 'maximum', 'format', 'multipleOf'];

export default class NumberType extends AnyType {

    constructor(library?: TypeLibrary, decl?: spec10.NumberTypeDeclaration) {
        super(library, decl);
        BuiltinFacets.forEach(n => {
            if (decl[n] !== undefined)
                this.set(n, decl[n]);
        });
    }

    get baseType(): string {
        return 'number';
    }

    get typeFamily(): string {
        return 'scalar';
    }

    hasFacet(n: string): boolean {
        return BuiltinFacets.includes(n) || super.hasFacet(n);
    }

    mergeOnto(target: AnyType) {
        if (target.attributes.format && this.attributes.format !== target.attributes.format)
            throw new Error('Can\'t merge different number formats');
        target.attributes.format = this.attributes.format;

        if (this.attributes.enum) {
            target.attributes.enum = target.attributes.enum || [];
            target.attributes.enum.push(...this.attributes.enum);
        }
        if (this.attributes.minimum != null) {
            target.attributes.minimum = target.attributes.minimum != null ?
                Math.min(target.attributes.minimum, this.attributes.minimum) :
                this.attributes.minimum;
        }
        if (this.attributes.maximum != null) {
            target.attributes.maximum = target.attributes.maximum != null ?
                Math.max(target.attributes.maximum, this.attributes.maximum) :
                this.attributes.maximum;
        }
        if (this.attributes.multipleOf != null) {
            target.attributes.multipleOf = target.attributes.multipleOf != null ?
                Math.min(target.attributes.multipleOf, this.attributes.multipleOf) :
                this.attributes.multipleOf;
        }
    }


    protected _generateValidationCode(options: IValidatorGenerateOptions): IFunctionData {
        const data = super._generateValidationCode(options);
        const {strictTypes} = options;
        const coerce = options.coerceTypes || options.coerceJSTypes;
        const enums = this.attributes.enum;
        if (enums)
            data.variables.enums = new Set(enums);

        const format = this.attributes.format;
        let minimum = this.attributes.minimum;
        let maximum = this.attributes.maximum;
        minimum = minimum != null ? minimum : MinValues[format];
        maximum = maximum != null ? maximum : MaxValues[format];
        const multipleOf = this.attributes.multipleOf;
        const bigFormat = ['bigint', 'int64', 'uint64', 'long'].includes(format);
        const intFormat = IntegerTypes.includes(format);

        data.variables.errorMsg1 = 'Value must be ' +
            (intFormat ? 'an integer' : 'a number') +
            (strictTypes ? '' : ' or ' +
                (intFormat ? 'integer' : 'number') +
                ' formatted string');

        data.code += `
    if (!((typeof value === 'number' || typeof value === 'bigint')`;
        if (!strictTypes)
            data.code += ` || (typeof value === 'string' && value)`;
        data.code += `)
    ) {
        error({
            message: errorMsg1,
            errorType: 'TypeError',
            path
        });
        return;
    }            
`;

        data.code += `
    let n;
    try {
        n = ${bigFormat ? 'BigInt(value)' : 'Number(value)'};
    } catch (e) {
        error({
            message: e.message,
            errorType: 'TypeError',
            path
        });
    }

    if (!(typeof n === 'bigint' || !isNaN(n))) {
        error({
            message: errorMsg1,
            errorType: 'TypeError',
            path
        });
        return;
    }
`;

        if (intFormat)
            data.code += `
    if (typeof n === 'number' && (n - Math.floor(n) > 0)) {
        error({
            message: errorMsg1,
            errorType: 'TypeError',
            path
        });
        return;
    }
`;

        if (enums)
            data.code += `
    if (!enums.has(n)) {
        error({
            message: 'Value must be a one of enumerated value',
            errorType: 'TypeError',
            path
        });
        return;
    }
`;

        if (multipleOf)
            data.code += `
    const c = typeof n === 'bigint' ?
        n / BigInt(${multipleOf}) * BigInt(${multipleOf}) :
        Math.trunc(n / ${multipleOf}) * ${multipleOf};
    if (n !== c) {
        error({
            message: 'Numeric value must be multiple of ${multipleOf}',
            errorType: 'TypeError',
            path
        });
        return;
    }
`;

        if (minimum != null)
            data.code += `
    if (n < ${minimum}) {
        error({
            message: 'Minimum accepted value is ${minimum}, actual ' + n,
            errorType: 'range-error',
            path,
            min: ${minimum}${maximum ? ', max: ' + maximum : ''},
            actual: n
        });
        return;
    }
`;

        if (maximum)
            data.code += `
    if (n > ${maximum}) {
        error({
            message: 'Maximum accepted value is ${maximum}, actual ' + n,
            errorType: 'range-error',
            path,
            ${minimum ? 'min: ' + minimum + ', ' : ''}max: ${maximum},
            actual: n
        });
        return;
    }
`;

        if (coerce)
            data.code += '\n    value = n;';

        return data;
    }

}
