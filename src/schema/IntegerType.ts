import NumberType from './NumberType';
import {Library} from "./Library";
import * as spec10 from "../spec10";

export default class IntegerType extends NumberType {

    constructor(library: Library, name: string) {
        super(library, name);
        this.format = 'int';
    }

    get baseType() {
        return 'integer';
    }

    set(src: IntegerType | spec10.NumberTypeDeclaration) {
        if (src.multipleOf && (src.multipleOf - Math.floor(src.multipleOf) > 0))
            throw new Error('multipleOf property must be an integer');
        if (src.minimum && (src.minimum - Math.floor(src.minimum) > 0))
            throw new Error('minimum property must be an integer');
        if (src.maximum && (src.maximum - Math.floor(src.maximum) > 0))
            throw new Error('maximum property must be an integer');
        super.set(src);
    }
}
