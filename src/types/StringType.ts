import AnyType, {
    IValidatorGenerateOptions,
    IFunctionData
} from './AnyType';
import * as spec10 from '../spec10';
import {TypeLibrary} from './TypeLibrary';

const BuiltinFacets = ['enum', 'pattern', 'minLength', 'maxLength'];

export default class StringType extends AnyType {

    constructor(library?: TypeLibrary, decl?: spec10.NumberTypeDeclaration) {
        super(library, decl);
        BuiltinFacets.forEach(n => {
            if (decl[n] !== undefined)
                this.set(n, decl[n]);
        });
    }

    get baseType(): string {
        return 'string';
    }

    get typeFamily(): string {
        return 'scalar';
    }

    set(n: string, value) {
        if (n === 'pattern' && value) {
            this.attributes.pattern = Array.isArray(value) ? value : [value];
            return;
        }
        if (n === 'enum' && value) {
            this.attributes.enum = Array.isArray(value) ? value : [value];
            return;
        }
        super.set(n, value);
    }

    hasFacet(n: string): boolean {
        return BuiltinFacets.includes(n) || super.hasFacet(n);
    }

    protected _mergeOnto(target: AnyType) {
        if (this.attributes.pattern) {
            target.attributes.pattern = target.attributes.pattern || [];
            target.attributes.pattern.push(...this.attributes.pattern);
        }
        if (this.attributes.enum) {
            target.attributes.enum = target.attributes.enum || [];
            target.attributes.enum.push(...this.attributes.enum);
        }
        if (this.attributes.minLength != null) {
            target.attributes.minLength = target.attributes.minLength != null ?
                Math.min(target.attributes.minLength, this.attributes.minLength) :
                this.attributes.minLength;
        }
        if (this.attributes.maxLength != null) {
            target.attributes.maxLength = target.attributes.maxLength != null ?
                Math.max(target.attributes.maxLength, this.attributes.maxLength) :
                this.attributes.maxLength;
        }
    }

    protected _generateValidationCode(options: IValidatorGenerateOptions): IFunctionData {
        const data = super._generateValidationCode(options);
        const {strictTypes} = options;
        const coerce = options.coerceTypes || options.coerceJSTypes;
        const enums = this.attributes.enum;
        if (enums)
            data.variables.enums = new Set(enums);
        const minLength = this.attributes.minLength || 0;
        const maxLength = this.attributes.maxLength || 0;
        const patterns = this.attributes.pattern;
        if (patterns) {
            data.variables.patterns = Array.isArray(patterns) ?
                patterns.map(x => new RegExp(x)) :
                (patterns ? [new RegExp(patterns)] : null);
        }

        data.code += `
    if (!(typeof value === 'string'`;
        if (!strictTypes)
            data.code += ` || (typeof value === 'number' || typeof value === 'bigint')`;
        data.code += `)
    ) {
        error({
            message: 'Value must be a string',
            errorType: 'TypeError',
            path
        });
        return;
    }            
`;

        data.code += `
    const v = String(value);`;

        if (enums)
            data.code += `
    if (!enums.has(v)) {
        error({
            message: 'Value must be a one of enumerated value',
            errorType: 'TypeError',
            path
        });
        return;
    }
`;

        if (minLength != null)
            data.code += `
    if (v.length < ${minLength}) {
        error({
            message: 'Minimum accepted length is ${minLength}, actual ' + v.length,
            errorType: 'RangeError',
            path,                
            min: ${minLength}${maxLength ? ', max: ' + maxLength : ''},                
            actual: v.length
        });
        return;
    }
`;

        if (maxLength)
            data.code += `
    if (v.length > ${maxLength}) {
        error({
            message: 'Maximum accepted length is ${maxLength}, actual ' + v.length,
            errorType: 'RangeError',
            path,
            ${minLength ? 'min: ' + minLength + ', ' : ''}max: ${maxLength},               
            actual: v.length
        });
        return;
    }
`;

        if (patterns)
            data.code += `
    let matched;
    const patternLen = patterns.length;
    for (let i = 0; i < patternLen; i++) {
        if (v.match(patterns[i])) {
            matched = true;
            break;
        }
    }
    if (!matched) {
        error({
            message: 'Value does not match required format',
            errorType: 'format-error',
            path
        });
        return;
    }
`;

        if (coerce)
            data.code += '\n    value = v;';

        return data;
    }

}
