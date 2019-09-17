import AnyType from './AnyType';

export default class UnionType extends AnyType {
    anyOf?: AnyType[];
}
