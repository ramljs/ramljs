import Type, {InternalValidateFunction, IValidateOptions, LogFunction} from './Type';
import * as spec10 from "../spec10";
import {errors} from "raml-1-parser/dist/parser/wrapped-ast/parserCore";

export default class ObjectType extends Type {

    public discriminator?: string;
    public discriminatorValue?: string;
    public properties: { [index: string]: Type } = {};
    public minProperties?: number;
    public maxProperties?: number;
    public additionalProperties?: boolean = true;

    set(src: ObjectType | spec10.ObjectTypeDeclaration) {
        super.set(src);
        this._copyProperties(src,
            ['discriminator', 'discriminatorValue', 'minProperties', 'maxProperties', 'additionalProperties']);
        if (src instanceof ObjectType)
            Object.assign(this.properties, src.properties);
        else {
            const addProperty = (name, prop) => {
                const t = this.library.getType(prop);
                t.name = name;
                this.properties[name] = t;
            };
            if (Array.isArray(src.properties)) {
                for (const prop of src.properties) {
                    addProperty(prop.name, prop);
                }
            } else if (typeof src.properties === 'object') {
                for (const k of Object.keys(src.properties)) {
                    addProperty(k, src.properties[k]);
                }
            }
        }
    }

    get baseType() {
        return 'object';
    }

    protected _generateValidateFunction(options: IValidateOptions): InternalValidateFunction {
        const superValidate = super._generateValidateFunction(options);
        const {
            discriminator,
            minProperties,
            maxProperties,
            additionalProperties
        } = this;
        const removeAdditional = options.removeAdditional === 'all' ||
            (options.removeAdditional && !additionalProperties);
        const discriminatorValue = this.discriminatorValue || this.name;
        const properties = this.properties;
        const propertyKeys = Object.keys(properties);
        const propertyCoercers = {};
        for (const k of propertyKeys) {
            // noinspection TypeScriptUnresolvedFunction
            // @ts-ignore
            propertyCoercers[k] = properties[k]._generateValidateFunction(options);
        }

        return (value: any, path: string, log?: LogFunction) => {
            value = superValidate(value, path, log);
            if (value == null)
                return value;

            if (typeof value !== 'object' || Array.isArray(value)) {
                log({
                        message: 'Value must be an object',
                        errorType: 'TypeError',
                        path
                    }
                );
                return;
            }

            if (discriminator && value[discriminator] !== discriminatorValue) {
                log({
                        message: `Object ${discriminator} value must be "${discriminatorValue}"`,
                        errorType: 'TypeError',
                        log,
                        discriminatorValue,
                        actual: value[discriminator],
                    }
                );
                return;
            }
            const keys = Object.keys(value);
            const allErrors = options && options.allErrors;

            // Check additional properties
            if (!additionalProperties && !allErrors && !removeAdditional &&
                keys.some(x => !properties.hasOwnProperty(x))) {
                log({
                        message: 'Object type does not allow additional properties',
                        errorType: 'TypeError',
                        path
                    }
                );
            }

            let errLen = 0;

            // If this is a structured object
            if (propertyKeys.length) {
                const keysLen = keys.length;
                const result = {};
                for (let i = 0; i < keysLen; i++) {
                    const k = keys[i];
                    const propc = propertyCoercers[k];
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

            if (minProperties && keys.length < minProperties) {
                errLen++;
                log({
                        message: `Minimum accepted properties ${minProperties}, actual ${keys.length}`,
                        errorType: 'range-error',
                        path,
                        range: [minProperties, maxProperties],
                        actual: value.length
                    }
                );
            }
            if (maxProperties && keys.length > maxProperties) {
                errLen++;
                log({
                        message: `Maximum accepted properties ${maxProperties}, actual ${keys.length}`,
                        errorType: 'range-error',
                        path,
                        range: [minProperties, maxProperties],
                        actual: value.length
                    }
                );
            }
            return !errLen ? value : undefined;
        };
    }

}
