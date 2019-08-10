import DateTimeType from './DateTimeType';
import * as spec10 from "../spec10";
import {TypeLibrary} from "./TypeLibrary";

export default class TimeOnlyType extends DateTimeType {

    constructor(library: TypeLibrary, name: string) {
        super(library, name);
        delete this.format;
    }

    get baseType(): string {
        return 'time-only';
    }

    extend(decl: spec10.DateTypeDeclaration): TimeOnlyType {
        return super.extend({
            ...decl,
            format: null
        }) as TimeOnlyType;
    }

    protected _formatDate() {
        return (d: Date) => {
            const s = d.toISOString();
            return s.substring(11, s.length - 1);
        };
    }

    protected _formatDateItems() {
        const dateItemsToISO = this._dateItemsToISO();
        return (m: string[]) => {
            const s = dateItemsToISO(m);
            return s.substring(11, s.length - 1);
        };
    }

    protected _matchDatePattern() {
        const PATTERN = /^([01][0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?(?:\.?(\d+))?$/;
        return (v: string) => {
            const m = v.match(PATTERN);
            return m ? [v, '1970', '01', '01', ...m.slice(1)] : m;
        };
    }

}
