import DateTimeType from './DateTimeType';

export default class TimeOnlyType extends DateTimeType {

    get baseType() {
        return 'time-only';
    }

    protected _encode(v) {
        return v == null ? null : String(v);
    }

    protected _decode(v) {
        return v == null ? null : String(v);
    }

}
