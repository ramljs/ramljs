import AnyType, {
    IValidatorGenerateOptions,
    IFunctionData
} from './AnyType';
import * as spec10 from '../spec10';
import {TypeLibrary} from './TypeLibrary';

const BuiltinFacets = ['discriminator', 'discriminatorValue', 'additionalProperties',
    'minProperties', 'maxProperties'];

export default class ObjectType extends AnyType {

    public properties: { [index: string]: AnyType };

    constructor(library?: TypeLibrary, decl?: spec10.ObjectTypeDeclaration) {
        super(library, decl);
        this.properties = {};
        BuiltinFacets.forEach(n => {
            if (decl[n] !== undefined)
                this.set(n, decl[n]);
        });
        if (Array.isArray(decl.properties)) {
            for (const prop of decl.properties) {
                this.properties[prop.name] = library.createType(prop);
            }
        } else if (typeof decl.properties === 'object') {
            for (const k of Object.keys(decl.properties)) {
                let prop = decl.properties[k] as any;
                if (!(typeof prop === 'object'))
                    prop = {type: prop};
                this.properties[k] = library.createType({
                    ...prop,
                    name: k
                });
            }
        }
    }

    get baseType(): string {
        return 'object';
    }

    get typeFamily(): string {
        return 'object';
    }

    hasFacet(n: string): boolean {
        return BuiltinFacets.includes(n) || super.hasFacet(n);
    }

    clone(): ObjectType {
        const t = super.clone() as ObjectType;
        for (const k of Object.keys(this.properties)) {
            t.properties[k] = this.properties[k].clone();
        }
        return t;
    }

    protected _mergeOnto(target: ObjectType, supplemental?: boolean) {
        if (this.attributes.minProperties != null) {
            target.attributes.minProperties = target.attributes.minProperties != null ?
                Math.min(target.attributes.minProperties, this.attributes.minProperties) :
                this.attributes.minProperties;
        }
        if (this.attributes.maxProperties != null) {
            target.attributes.maxProperties = target.attributes.maxProperties != null ?
                Math.max(target.attributes.maxProperties, this.attributes.maxProperties) :
                this.attributes.maxProperties;
        }
        for (const k of Object.keys(this.properties)) {
            target.properties[k] = this.properties[k].clone();
            if (!supplemental)
                target.properties[k].attributes.required = true;
        }
        if (!supplemental) {
            BuiltinFacets.forEach(n => {
                if (this.attributes[n] !== undefined)
                    target.attributes[n] = this.attributes[n];
            });
        }
    }

    protected _generateValidationCode(options: IValidatorGenerateOptions): IFunctionData {
        const data = super._generateValidationCode(options);

        const discriminator = data.variables.discriminator = this.attributes.discriminator;
        data.variables.discriminatorValue = this.attributes.discriminatorValue || this.name;
        const additionalProperties = data.variables.additionalProperties =
            !options.removeAdditional &&
            (this.attributes.additionalProperties != null ? this.attributes.additionalProperties : true);
        const minProperties = data.variables.minProperties =
            parseInt(this.attributes.minProperties, 10) || 0;
        const maxProperties = data.variables.maxProperties =
            parseInt(this.attributes.maxProperties, 10) || 0;
        const maxErrors = options.maxObjectErrors || 0;

        let ignoreRequire = options.ignoreRequire;
        const properties = data.variables.properties = this.properties;
        const propertyKeys = data.variables.propertyKeys = Object.keys(properties);
        let prePropertyValidators;
        let propertyValidators;
        if (propertyKeys.length) {
            // create a new ignoreRequire for nested properties
            if (Array.isArray(ignoreRequire)) {
                const name = this.name;
                ignoreRequire = data.variables.ignoreRequire =
                    ignoreRequire.reduce((result, x) => {
                        if (x.startsWith(name + '.'))
                            result.push(x.substring(name.lengh + 1));
                        return result;
                    }, []);
            }

            /* We have to be sure if value is the object type that we are looking for
             * before coercing or removing additional properties.
             * If discriminator is not defined we can not know the object type.
             * So we apply a pre validation.
             */
            if (options.isUnion && !discriminator) {
                prePropertyValidators = data.variables.prePropertyValidators = {};
                for (const k of propertyKeys) {
                    // @ts-ignore
                    prePropertyValidators[k] = properties[k]._generateValidateFunction({
                        ...options,
                        coerceTypes: false,
                        coerceJSTypes: false,
                        removeAdditional: false,
                        maxArrayErrors: 0,
                        maxObjectErrors: 0,
                        throwOnError: false
                    });
                }
            }
            propertyValidators = data.variables.propertyValidators = {};
            for (const k of propertyKeys) {
                const opts = maxErrors > 1 ? {...options, throwOnError: false} : options;
                // @ts-ignore
                propertyValidators[k] = properties[k]._generateValidateFunction(opts);
            }
        }

        data.code += `
    if (typeof value !== 'object' || Array.isArray(value)) {
        error({
                message: 'Value must be an object',
                errorType: 'TypeError',
                path
            }
        );
        return;
    }
`;

        if (discriminator)
            data.code += `
    if (value[discriminator] !== discriminatorValue) {
        error({
            message: 'Object\`s discriminator property (' + discriminator + 
                ') does not match to "' + discriminatorValue + '"',
            errorType: 'TypeError',
            error,
            discriminatorValue,
            actual: value[discriminator],
        });
        return;
    }
`;

        if (!additionalProperties || minProperties || maxProperties || propertyValidators)
            data.code += `    
    const valueKeys = Object.keys(value);   
`;

        if (minProperties) {
            data.code += `
    if (valueKeys.length < minProperties) {
        error({
            message: 'Minimum accepted properties ' + minProperties + ', actual ' + valueKeys.length,
            errorType: 'range-error',
            path,
            min: ${minProperties}${maxProperties ? ', max: ' + maxProperties : ''},
            actual: valueKeys.length
        });
        return;
    }
`;
        }

        if (maxProperties)
            data.code += `
    if (valueKeys.length > maxProperties) {
        error({
            message: 'Maximum accepted properties ' + maxProperties +', actual ' + valueKeys.length,
            errorType: 'range-error',
            path,
            ${minProperties ? 'min: ' + minProperties + ', ' : ''}max: ${maxProperties},
            actual: valueKeys.length
        });
        return;
    }
`;

        if (prePropertyValidators) {
            data.code += `
    const preKeys = Object.keys(prePropertyValidators);  
    for (let i = 0; i < ${propertyKeys.length}; i++) {
        const k = preKeys[i];
        const fn = prePropertyValidators[k];
        const _path = path ? path + '.' + k : k;
        let hasError;
        const vv = fn(value[k], _path, () => {hasError: true});
        if (hasError) return;                    
    }            
            `;
        }

        // Iterate over value properties than iterate over type properties
        if (propertyValidators) {
            const needResult = options.coerceTypes || options.removeAdditional;

            data.code += `
    let numErrors = 0;        
    const subError = (...args) => {
      numErrors++;
      error(...args);
    }                        
    const prpVlds = Object.assign({}, propertyValidators);
    let keysLen = valueKeys.length;
    ${needResult ? 'const result = {};' : ''}
    for (let i = 0; i < keysLen; i++) {
        const k = valueKeys[i];
        const fn = propertyValidators[k];
        const _path = path ? path + '.' + k : k;
        if (fn) {
            delete prpVlds[k];
            const vv = fn(value[k], _path, subError);
            if (vv === undefined) {
                ${maxErrors > 1 ? `if (numErrors >= maxErrors) return;
                continue;` : 'return;'}
            }                                   
            ${needResult ? 'result[k] = vv;' : ''}                           
        }`;
            if (additionalProperties) {
                if (needResult)
                    data.code += `else result[k] = value[k];`;
            } else if (!options.removeAdditional)
                data.code += `else {
            error({
                    message: 'Object type does not allow additional properties',
                    errorType: 'TypeError',
                    path: _path
                }
            );
            ${maxErrors > 1 ? 'if (++numErrors >= maxErrors) return;' : ''}
        }`;
            data.code += `         
    }
    
    const keys = Object.keys(prpVlds);
    keysLen = keys.length;
    for (let i = 0; i < keysLen; i++) {
        const k = keys[i];
        const fn = prpVlds[k];
        const _path = path ? path + '.' + k : k;
        const n = numErrors;
        const vv = fn(value[k], _path, subError);
        if (numErrors > n)
          ${maxErrors > 1 ? 'if (numErrors >= maxErrors) return;' : 'return'}
        ${needResult ? 'if (vv != undefined) result[k] = vv;' : ''}                    
    }
    
    ${needResult ? 'value = result;' : ''};    
        `;
        }

        return data;
    }
}
