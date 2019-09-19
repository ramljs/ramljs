import AnyType from './AnyType';

export default class ArrayType extends AnyType {
    items?: AnyType;
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;

    protected _copyTo(target: ArrayType, overwrite?: boolean): void;

}
