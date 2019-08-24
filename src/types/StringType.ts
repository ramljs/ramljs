import AnyType, {
    IValidateOptions,
    IValidateRules,
    IFunctionData
} from './AnyType';
import * as spec10 from "../spec10";
import {TypeLibrary} from "./TypeLibrary";

const BuiltinFacets = ['enum', 'pattern', 'minLength', 'maxLength'];

export default class StringType extends AnyType {

    constructor(library?: TypeLibrary, decl?: spec10.NumberTypeDeclaration) {
        super(library, decl);
        BuiltinFacets.forEach(n => {
            if (decl[n] !== undefined)
                this[n] = decl[n];
        });
    }

    get baseType(): string {
        return 'string';
    }

    get typeFamily(): string {
        return 'scalar';
    }

    get enum(): string[] {
        return this.get('enum');
    }

    set enum(v: string[]) {
        this.set('enum', v);
    }

    get pattern(): string[] {
        return this.get('pattern');
    }

    set pattern(v: string[]) {
        this.set('pattern', v);
    }

    get minLength(): string[] {
        return this.get('minLength');
    }

    set minLength(v: string[]) {
        this.set('minLength', v);
    }

    get maxLength(): string[] {
        return this.get('maxLength');
    }

    set maxLength(v: string[]) {
        this.set('maxLength', v);
    }

    hasFacet(n: string): boolean {
        return BuiltinFacets.includes(n) || super.hasFacet(n);
    }

    protected _generateValidateBody(options: IValidateOptions, rules: IValidateRules = {}): IFunctionData {
        const data = super._generateValidateBody(options, rules);
        const strRules = rules.string || {};
        const {strictTypes} = options;
        const coerce = options.coerceTypes || options.coerceJSTypes;
        const enums = !strRules.noEnumCheck && this.get('enum');
        if (enums)
            data.variables.enums = new Set(enums);
        const minLength = !strRules.noMinLengthCheck && this.get('minLength') || 0;
        const maxLength = !strRules.noMaxLengthCheck && this.get('maxLength') || 0;
        const patterns = !strRules.noMaxLengthCheck && this.get('pattern');
        if (patterns) {
            data.variables.patterns = Array.isArray(patterns) ?
                patterns.map(x => new RegExp(x)) :
                (patterns ? [new RegExp(patterns)] : null);
        }

        if (!rules.noTypeCheck) {
            data.code += `
    if (!(typeof value === 'string'`;
            if (!strictTypes)
                data.code += ` || (typeof value === 'number' || typeof value === 'bigint')`;
            data.code += `)
    ) {
        log({
            message: 'Value must be a string',
            errorType: 'TypeError',
            path
        });
        return;
    }            
`;
        }

        data.code += `
    const v = String(value);`;

        if (enums)
            data.code += `
    if (!enums.has(v)) {
        log({
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
        log({
                message: 'Minimum accepted length is ${minLength}, actual ' + v.length,
                errorType: 'RangeError',
                path,                
                min: ${minLength}${maxLength ? maxLength : ', max: ' + maxLength},
                actual: v.length
            }
        );
    }
`;

        if (maxLength)
            data.code += `
    if (v.length > ${maxLength}) {
        log({
                message: 'Maximum accepted length is ${maxLength}, actual ' + v.length,
                errorType: 'RangeError',
                path,
                ${minLength ? 'min: ' + minLength + ', ' : ''}max: ${maxLength},               
                actual: v.length
            }
        );
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
        log({
                message: 'Value does not match required format',
                errorType: 'format-error',
                path
            }
        );
        return;
    }
`;

        if (coerce)
            data.code += '\n    value = v;';

        return data;
    }

}
