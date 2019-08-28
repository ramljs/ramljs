import * as spec10 from '../spec10';
import {TypeLibrary} from './TypeLibrary';
import DateType from './DateType';

export default class DateTimeType extends DateType {

    constructor(library?: TypeLibrary, decl?: spec10.DateTypeDeclaration) {
        super(library, decl);
    }

    get baseType(): string {
        return 'datetime';
    }

    hasFacet(n: string): boolean {
        return n === 'format' || super.hasFacet(n);
    }

    mergeOnto(target: DateType, overwrite?: boolean) {
        if (target.attributes.format && this.attributes.format !== target.attributes.format)
            throw new Error('Can\'t merge different number formats');
        target.attributes.format = this.attributes.format;
    }

}
