import AnyType from './AnyType';

export default class NumberType extends AnyType {
    enum?: number[];
    format?: 'int64' | 'bigint' | 'int32' | 'int' | 'int16' | 'int8' |
        'uint64' | 'uint32' | 'uint16' | 'uint8' | 'long' | 'float' | 'double';
    minimum?: number;
    maximum?: number;
    multipleOf?: number;

    protected _copyTo(target: NumberType, overwrite?: boolean): void;
}

export declare type NumberFormats = string[];
export declare type IntegerFormats = string[];
export declare type MinValues = { [index: string]: number };
export declare type MaxValues = { [index: string]: number };
