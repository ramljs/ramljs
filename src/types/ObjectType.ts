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
                const prop = decl.properties[k] as spec10.TypeDeclaration;
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

    mergeOnto(target: ObjectType, overwrite?: boolean) {
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
        }
        if (overwrite) {
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
            this.attributes.additionalProperties != null ?
                this.attributes.additionalProperties : true;
        const minProperties = data.variables.minProperties =
            parseInt(this.attributes.minProperties, 10) || 0;
        const maxProperties = data.variables.maxProperties =
            parseInt(this.attributes.maxProperties, 10) || 0;

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
            if (options.isUnion && !discriminator &&
                (options.coerceTypes || options.coerceJSTypes || options.removeAdditional)) {
                prePropertyValidators = data.variables.prePropertyValidators = {};
                for (const k of propertyKeys) {
                    prePropertyValidators[k] = properties[k].validator({
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
                propertyValidators[k] = properties[k].validator(options);
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

        if (!additionalProperties || propertyKeys.length)
            data.code += `    
    const valueKeys = Object.keys(value);
    const valueLen = valueKeys.length;
`;

        if (!additionalProperties)
            data.code += `    
    if (valueKeys.some(x => !properties.hasOwnProperty(x))) {
        error({
            message: 'Object type does not allow additional properties',
            errorType: 'TypeError',
            path
        });
        return;
    }
`;

        if (minProperties) {
            data.code += `
    if (valueLen < minProperties) {
        error({
            message: 'Minimum accepted properties ' + minProperties + ', actual ' + valueLen,
            errorType: 'range-error',
            path,
            min: ${minProperties}${maxProperties ? ', max: ' + maxProperties : ''},
            actual: valueLen
        });
        return;
    }
`;
        }

        if (maxProperties)
            data.code += `
    if (valueLen > maxProperties) {
        error({
            message: 'Maximum accepted properties ' + maxProperties +', actual ' + valueLen,
            errorType: 'range-error',
            path,
            ${minProperties ? 'min: ' + minProperties + ', ' : ''}max: ${maxProperties},
            actual: valueLen
        });
        return;
    }
`;

        if (propertyValidators) {
            data.code += `
    // const propertyLen = ${propertyValidators.length};
    const keysLen = valueKeys.length;
    const result = {};
    for (let i = 0; i < keysLen; i++) {
        const k = valueKeys[i];
        const propc = propertyValidators[k];
        if (propc) {
            const vv = propc(value[k], path + '.' + k, error);
            if (vv === undefined && !allErrors)
                return undefined;
            if (vv !== undefined)
                result[k] = vv;
        } else if (!removeAdditional && additionalProperties) {
            result[k] = value[k];
        } else if (!removeAdditional) {
            errLen++;
            error({
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

        if (options.coerceTypes || options.coerceJSTypes)
            data.code += '\n    value = v;';

        return data;
    }
}
