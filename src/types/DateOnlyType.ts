import DateType from './DateType';
import * as spec10 from '../spec10';
import {TypeLibrary} from './TypeLibrary';

export default class DateOnlyType extends DateType {

    constructor(library?: TypeLibrary, decl?: spec10.DateTypeDeclaration) {
        super(library, {
            ...decl,
            format: null
        });
    }

    get baseType(): string {
        return 'date-only';
    }

    protected _formatDate() {
        return (d: Date) => {
            const s = d.toISOString();
            return s.substring(0, 10);
        };
    }

    protected _formatDateItems() {
        const dateItemsToISO = this._dateItemsToISO();
        return (m: string[]) => {
            const s = dateItemsToISO(m);
            return s.substring(0, 10);
        };
    }

    protected _matchDatePattern() {
        const PATTERN = /^(\d{4})-(0[1-9]|1[012])-([123]0|[012][1-9]|31)$/;
        return (v: string) => {
            const m = v.match(PATTERN);
            if (m && m[2] === '02' && m[3] > '29')
                return;
            return m;
        };
    }

}
