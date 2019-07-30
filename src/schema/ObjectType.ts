import Type, {ICoerceOptions} from './Type';
import * as spec10 from "../spec10";
import Library from "./Library";
import {ValidationError} from "../ValidationError";

export default class ObjectType extends Type {

    public discriminator?: string;
    public discriminatorValue?: string;
    public properties: { [index: string]: Type } = {};
    public minProperties?: number;
    public maxProperties?: number;
    public additionalProperties?: boolean = true;

    mix(src: ObjectType | spec10.ObjectTypeDeclaration) {
        super.mix(src);
        this._copyProperties(src,
            ['discriminator', 'discriminatorValue', 'minProperties', 'maxProperties', 'additionalProperties']);
        if (Array.isArray(src.properties)) {
            for (const prop of src.properties) {
                this.properties[prop.name] = this.library.getType(prop);
            }
        }
    }

    get baseType() {
        return 'object';
    }

    protected _getJSCoercer() {
        const {
            discriminator,
            discriminatorValue,
            minProperties,
            maxProperties,
            additionalProperties
        } = this;
        const propertyKeys = Object.keys(this.properties);
        return (v: any, options?: ICoerceOptions) => {
            const location = (options && options.location) || '';
            if (typeof v !== 'object')
                throw new ValidationError(
                    `Value is not an object`, 'Type error', location);
            const keys = Object.keys(v);
            if (!additionalProperties) {
                const a = keys.filter(x => !propertyKeys.includes(x));
                if (a.length)
                    throw new ValidationError(
                        `Additional properties (${a.join(',')}) is not accepted`,
                        'Additional properties is not accepted error', location);
            }

            if (minProperties && keys.length < minProperties)
                throw new ValidationError(
                    `Minimum accepted properties ${minProperties}, actual${keys.length}`,
                    'Value length out of range error', location);
            if (maxProperties && keys.length > maxProperties)
                throw new ValidationError(
                    `Maximum accepted properties ${maxProperties}, actual${keys.length}`,
                    'Value length out of range error', location);
            return v;
        };
    }

    protected _getJSONCoercer() {
        return this._getJSCoercer();
    }

}
