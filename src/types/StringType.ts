import AnyType, {LogFunction, InternalValidateFunction, IValidateOptions, IValidateRules} from './AnyType';
import * as spec10 from "../spec10";
import {TypeLibrary} from "./TypeLibrary";

export default class StringType extends AnyType {

    public enum: string[];
    public pattern?: string | string[];
    public minLength?: number;
    public maxLength?: number;

    constructor(library: TypeLibrary, name: string) {
        super(library, name);
        this.enum = undefined;
        this.pattern = undefined;
        this.minLength = undefined;
        this.maxLength = undefined;
    }

    get baseType(): string {
        return 'string';
    }

    get typeFamily(): string {
        return 'scalar';
    }

    extend(decl: spec10.StringTypeDeclaration): StringType {
        const inst = super.extend(decl) as StringType;
        ['enum', 'pattern', 'minLength', 'maxLength'].forEach(n => {
            if (decl[n] !== undefined)
                inst[n] = decl[n];
        });
        return inst;
    }

    protected _generateValidator(options: IValidateOptions, rules: IValidateRules = {}): InternalValidateFunction {
        const superValidate = super._generateValidator(options, rules);
        const strRules = rules.string || {};
        const {strictTypes} = options;
        const coerce = options.coerceTypes || options.coerceJSTypes;
        let enums = !strRules.noEnumCheck && this.getFacet('enum');
        if (enums)
            enums = new Set(enums);
        const minLength = !strRules.noMinLengthCheck && this.getFacet('minLength') || 0;
        const maxLength = !strRules.noMaxLengthCheck && this.getFacet('maxLength') || 0;
        let patterns = !strRules.noMaxLengthCheck && this.getFacet('pattern');
        if (patterns) {
            patterns = Array.isArray(patterns) ?
                patterns.map(x => new RegExp(x)) :
                (patterns ? [new RegExp(patterns)] : null);
        }

        let code = `        
return (value, path, log, context) => {        
    value = superValidate(value, path, log);
    if (value == null)
        return value;
`;

        if (!rules.noTypeCheck) {
            code += `
    if (!(typeof value === 'string'`;
            if (!strictTypes)
                code += ` || (typeof value === 'number' || typeof value === 'bigint')`;
            code += `)
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

        code += `
    const v = String(value);`;

        if (enums)
            code += `
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
            code += `
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
            code += `
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
            code += `
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

        code += `
    return ${coerce ? 'v' : 'value'};\n}`;

        const fn = new Function('superValidate', 'enums', 'patterns', code);
        return fn(superValidate, enums, patterns);
    }

}
