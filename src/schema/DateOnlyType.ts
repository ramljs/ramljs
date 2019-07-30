import DateTimeType from './DateTimeType';

export default class DateOnlyType extends DateTimeType {

    get baseType() {
        return 'date-only';
    }

    protected _encode(v) {
        return v == null ? null : String(v);
    }

    protected _decode(v) {
        return v == null ? null : String(v);
    }

}
