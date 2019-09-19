import AnyType from './AnyType';

export default class UnionType extends AnyType {
    anyOf?: AnyType[];

    protected _copyTo(target: UnionType, overwrite?: boolean): void;
}
