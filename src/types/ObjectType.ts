import AnyType, {InternalValidateFunction, IValidateOptions, IValidateRules, LogFunction} from './AnyType';
import * as spec10 from "../spec10";
import {TypeLibrary} from "./TypeLibrary";

export default class ObjectType extends AnyType {

    public discriminator?: string;
    public discriminatorValue?: string;
    public properties: { [index: string]: AnyType };
    public minProperties?: number;
    public maxProperties?: number;
    public additionalProperties?: boolean;

    constructor(library: TypeLibrary, name: string) {
        super(library, name);
        this.discriminator = undefined;
        this.discriminatorValue = undefined;
        this.properties = {};
        this.minProperties = undefined;
        this.maxProperties = undefined;
        this.additionalProperties = undefined;
    }

    get baseType(): string {
        return 'object';
    }

    get typeFamily(): string {
        return 'object';
    }

    extend(decl: spec10.ObjectTypeDeclaration): ObjectType {
        const inst = super.extend(decl) as ObjectType;
        ['discriminator', 'discriminatorValue', 'minProperties', 'maxProperties', 'additionalProperties'].forEach(n => {
            if (decl[n] !== undefined)
                inst[n] = decl[n];
        });
        if (Array.isArray(decl.properties)) {
            for (const prop of decl.properties) {
                this.properties[prop.name] = this.library.createType(prop);
            }
        } else if (typeof decl.properties === 'object') {
            for (const k of Object.keys(decl.properties)) {
                const prop = decl.properties[k] as spec10.TypeDeclaration;
                this.properties[k] = this.library.createType({
                    ...prop,
                    name: k
                });
            }
        }
        return inst;
    }

    _getProperties(target) {
        for (const t of this._successors) {
            (t as ObjectType)._getProperties(target);
        }
    }

    protected _generateValidator(options: IValidateOptions, rules: IValidateRules = {}): InternalValidateFunction {
        const superValidate = super._generateValidator(options, rules);
        const objRules = rules.object || {};

        let discriminator = !objRules.noDiscriminatorCheck && this.getFacet('discriminator');
        if (discriminator)
            discriminator = String(discriminator).replace(/'/g, '\\\'');
        let discriminatorValue = !objRules.noDiscriminatorCheck && this.getFacet('discriminatorValue', this.name);
        if (discriminatorValue)
            discriminatorValue = String(discriminatorValue).replace(/'/g, '\\\'');
        const additionalProperties = objRules.noAdditionalPropertiesCheck ||
            this.getFacet('additionalProperties', true);
        const minProperties = (!objRules.noMinPropertiesCheck &&
            parseInt(this.getFacet('minProperties'), 10)) || 0;
        const maxProperties = (!objRules.noMaxPropertiesCheck &&
            parseInt(this.getFacet('maxProperties'), 10)) || 0;

        const properties = this.properties;
        const propertyKeys = Object.keys(properties);
        let propertyValidators;
        if (propertyKeys.length) {
            propertyValidators = {};
            for (const k of propertyKeys) {
                // noinspection TypeScriptUnresolvedFunction
                // @ts-ignore
                propertyValidators[k] = properties[k]._generateValidator(options);
            }
        }

        // Generate sub validators for inherited types
        const inheritedValidators = [];
        for (const t of this._successors) {
            // @ts-ignore
            inheritedValidators.push(t._generateValidator(options, {
                noRequiredCheck: true,
                noTypeCheck: true,
                object: {
                    noAdditionalPropertiesCheck: true,
                    noDiscriminatorCheck: true,
                    noMinPropertiesCheck: true,
                    noMaxPropertiesCheck: true,
                }
            }));
        }

        let code = `        
return (value, path, log, context) => {        
    value = superValidate(value, path, log);
    if (value == null)
        return value;
`;

        if (!rules.noTypeCheck)
            code += `
    if (typeof value !== 'object' || Array.isArray(value)) {
        log({
                message: 'Value must be an object',
                errorType: 'TypeError',
                path
            }
        );
        return;
    }
`;

        if (discriminator)
            code += `
    if (value['${discriminator}'] !== '${discriminatorValue}') {
        log({
                message: 'Object\`s discriminator property (${discriminator}) does not match to "${discriminatorValue}"',
                errorType: 'TypeError',
                log,
                discriminatorValue: '${discriminatorValue}',
                actual: value['${discriminator}'],
            }
        );
        return;
    }
`;

        code += `    
    const valueKeys = (context && context.valueKeys) || Object.keys(value);
    const valueLen = valueKeys.length;
`;

        if (!additionalProperties && !this._successors.length)
            code += `    
    if (valueKeys.some(x => !properties.hasOwnProperty(x))) {
        log({
                message: 'Object type does not allow additional properties',
                errorType: 'TypeError',
                path
            }
        );
        return;
    }
`;

        if (minProperties)
            code += `    
    if (valueLen < ${minProperties}) {        
        log({
                message: \`Minimum accepted properties ${minProperties}, actual \${valueLen}\`,
                errorType: 'range-error',
                path,
                range: [${minProperties}, ${maxProperties}],
                actual: valueLen
            }
        );
        return;
    }
`;

        if (maxProperties)
            code += `    
    if (valueLen > ${maxProperties}) {
        log({
                message: \`Maximum accepted properties ${maxProperties}, actual \${valueLen}\`,
                errorType: 'range-error',
                path,
                range: [${minProperties}, ${maxProperties}],
                actual: valueLen
            }
        );
        return;
    }
`;

        if (propertyKeys.length) {
            code += `
    const propertyLen = ${propertyKeys.length};               
    // const keysLen = valueKeys.length;
    const result = {};
    for (let i = 0; i < keysLen; i++) {
        const k = valueKeys[i];
        const propc = propertyValidators[k];
        if (propc) {
            const vv = propc(value[k], path + '.' + k, log);
            if (vv === undefined && !allErrors)
                return undefined;
            if (vv !== undefined)
                result[k] = vv;
        } else if (!removeAdditional && additionalProperties) {
            result[k] = value[k];
        } else if (!removeAdditional) {
            errLen++;
            log({
                    message: 'Object type does not allow additional properties',
                    errorType: 'TypeError',
                    path: path + '.' + k
                }
            );
        }
    }
    value = result;    
`;
        }


        code += `
    if (inheritedValidators) {
        context = {valueKeys};
        let k = inheritedValidators.length;
        for (let i = 0; i < k; i++) {
            value = inheritedValidators[i](value, path, log, context);
        }
    }
`;

        code += `
    return value;\n}`;

        const fn = new Function('superValidate', 'properties', 'inheritedValidators', code);
        return fn(superValidate, properties, inheritedValidators);
        /*
               // Store options in local variables.
                const discriminatorCheck = !(objOptions && objOptions.noDiscriminatorCheck);
                const typeCheck = !(objOptions && objOptions.noTypeCheck);
                const minPropertiesCheck = !(objOptions && objOptions.noMinPropertiesCheck);
                const maxPropertiesCheck = !(objOptions && objOptions.noMaxPropertiesCheck);
                const additionalPropertiesCheck = !(objOptions && objOptions.noAdditionalPropertiesCheck);
                const {coerceTypes, coerceJSTypes} = options;
                const coerce = coerceTypes || coerceJSTypes;

                // Store facets in local variables.
                const additionalProperties = this.getFacet('additionalProperties', true);
                const discriminator = discriminatorCheck && this.getFacet('discriminator');
                const discriminatorValue = discriminatorCheck && this.getFacet('discriminatorValue', this.name);
                const minProperties = minPropertiesCheck && this.getFacet('minProperties');
                const maxProperties = maxPropertiesCheck && this.getFacet('maxProperties');

                const removeAdditional = options.removeAdditional === 'all' ||
                    (options.removeAdditional && !additionalProperties);

                // Generate sub validators for properties
                // const properties = this.properties;
                // const propertyKeys = Object.keys(properties);
                // let propertyValidators;
                if (propertyKeys.length) {
                    propertyValidators = {};
                    for (const k of propertyKeys) {
                        // noinspection TypeScriptUnresolvedFunction
                        // @ts-ignore
                        propertyValidators[k] = properties[k]._generateValidator(options);
                    }
                }

                return (value: any, path: string, log?: LogFunction, context?: any) => {

                    const valueKeys = (context && context.valueKeys) || Object.keys(value);
                    let errLen = 0;

                    // If this is a structured object
                    if (coerce && propertyKeys.length) {
                        const keysLen = valueKeys.length;
                        const result = {};
                        for (let i = 0; i < keysLen; i++) {
                            const k = valueKeys[i];
                            const propc = propertyValidators[k];
                            if (propc) {
                                const vv = propc(value[k], path + '.' + k, log);
                                if (vv === undefined && !allErrors)
                                    return undefined;
                                if (vv !== undefined)
                                    result[k] = vv;
                            } else if (!removeAdditional && additionalProperties) {
                                result[k] = value[k];
                            } else if (!removeAdditional) {
                                errLen++;
                                log({
                                        message: 'Object type does not allow additional properties',
                                        errorType: 'TypeError',
                                        path: path + '.' + k
                                    }
                                );
                            }
                        }
                        value = result;
                    }

                    return !errLen ? value : undefined;
                };
                */
    }
}
