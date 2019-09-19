import AnyType from './AnyType';

export default class NilType extends AnyType {
    required?: false;
    default?: null;
}
