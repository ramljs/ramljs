import AnyType from './AnyType';
import * as spec10 from '../spec10';
import {TypeLibrary} from './TypeLibrary';

export default class UnionType extends AnyType {

    public anyOf?: AnyType[];

    constructor(library?: TypeLibrary, decl?: spec10.TypeDeclaration) {
        super(library, decl);
        this.anyOf = [];
        if (decl.anyOf) {
            for (const typ of decl.anyOf) {
                this.anyOf.push(this._library.getType(typ));
            }
        }
    }

    get baseType(): string {
        return 'union';
    }

    get typeFamily(): string {
        return 'union';
    }

    get storedType(): string {
        return (this.anyOf && this.anyOf.length && this.anyOf[0].storedType) || 'union';
    }

    flatten(): AnyType[] {
        return this.anyOf.reduce((a, t) => {
            a.push(...t.flatten());
            return a;
        }, []);
    }

}
