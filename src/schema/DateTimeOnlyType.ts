import DateTimeType from './DateTimeType';
import * as spec10 from "../spec10";

export default class DateTimeOnlyType extends DateTimeType {

    get baseType() {
        return 'datetime-only';
    }

    set(src: DateTimeType | spec10.DateTypeDeclaration) {
        super.set(src);
        delete this.format;
    }

    protected _formatDate() {
        return (d: Date) => {
            const s = d.toISOString();
            return s.substring(0, s.length - 1);
        };
    }

    protected _formatDateItems() {
        const dateItemsToISO = this._dateItemsToISO();
        return (m: string[]) => {
            const s = m[9] ?
                new Date(dateItemsToISO(m)).toISOString()
                : dateItemsToISO(m);
            return s.substring(0, s.length - 1);
        };
    }

}
