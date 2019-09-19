import AnyType from './AnyType';

export default class ObjectType extends AnyType {
    discriminator?: string;
    discriminatorValue?: any;
    additionalProperties?: boolean;
    minProperties?: number;
    maxProperties?: number;
    typeOf: (value: any, t: ObjectType) => boolean;
    properties: {
        [index: string]: AnyType;
    };

    addProperty(name: string, prop: object | AnyType): AnyType;

    addProperties(properties: { [index: string]: object | AnyType });

    protected _copyTo(target: ObjectType, overwrite?: boolean): void;
}
