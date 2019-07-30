import Type from './Type';
import * as spec10 from "../spec10";

export default class DateTimeType extends Type {

    public format?: ['rfc3339', 'rfc2616'];

    mix(src: DateTimeType | spec10.DateTypeDeclaration) {
        super.mix(src);
        this._copyProperties(src, ['format']);
    }

    get baseType() {
        return 'datetime';
    }

    protected _encode(v) {
        return v == null ? null : String(v);
    }

    protected _decode(v) {
        return v == null ? null : String(v);
    }

}
