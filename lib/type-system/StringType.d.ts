import AnyType from './AnyType';

export default class StringType extends AnyType {
    enum?: string[];
    pattern?: string;
    minLength?: number;
    maxLength?: number;

    protected _copyTo(target: StringType, overwrite?: boolean): void;
}
