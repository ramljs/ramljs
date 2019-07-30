import Type from './Type';
import * as spec10 from "../spec10";

export default class UnionType extends Type {

    public anyOf?: Type[];

    get baseType() {
        return 'union';
    }

    mix(src: UnionType | spec10.TypeDeclaration) {
        super.mix(src);
        if (Array.isArray(src.anyOf)) {
            this.anyOf = [];
            for (const typ of src.anyOf) {
                if (typ instanceof Type)
                    this.anyOf.push(typ);
                else
                    this.anyOf.push(this.library.getType(typ));
            }
        }
    }

    protected _encode(v) {
        return v == null ? null : !!v;
    }

    protected _decode(v) {
        return v == null ? null : !!v;
    }

}
