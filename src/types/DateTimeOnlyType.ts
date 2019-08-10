import DateTimeType from './DateTimeType';
import * as spec10 from "../spec10";
import {TypeLibrary} from "./TypeLibrary";

export default class DateTimeOnlyType extends DateTimeType {

    constructor(library: TypeLibrary, name: string) {
        super(library, name);
        delete this.format;
    }

    get baseType(): string {
        return 'datetime-only';
    }

    extend(decl: spec10.DateTypeDeclaration): DateTimeOnlyType {
        return super.extend({
            ...decl,
            format: null
        }) as DateTimeOnlyType;
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
            const s = dateItemsToISO(m);
            return s.substring(0, s.length - 1);
        };
    }

    protected _matchDatePattern() {
        const PATTERN = /^(\d{4})-(0[1-9]|1[012])-([123]0|[012][1-9]|31)(?:T([01][0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?)?(?:\.?(\d+))?$/;
        return (v: string) => {
            const m = v.match(PATTERN);
            if (m && m[2] === '02' && m[3] > '29')
                return;
            return m;
        };
    }

}
