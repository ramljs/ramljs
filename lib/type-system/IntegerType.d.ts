import NumberType from './NumberType';

export default class IntegerType extends NumberType {
    format?: 'int64' | 'bigint' | 'int32' | 'int' | 'int16' | 'int8' |
        'uint64' | 'uint32' | 'uint16' | 'uint8' | 'long';

    protected _copyTo(target: IntegerType, overwrite?: boolean): void;
}
