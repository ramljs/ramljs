import NumberType from './NumberType';
import {TypeLibrary} from "./TypeLibrary";
import * as spec10 from "../spec10";

export default class IntegerType extends NumberType {

    constructor(library: TypeLibrary, name: string) {
        super(library, name);
        this.format = 'int';
    }

    get baseType(): string {
        return 'integer';
    }

    extend(decl: spec10.NumberTypeDeclaration): NumberType {
        if (decl.multipleOf && (decl.multipleOf - Math.floor(decl.multipleOf) > 0))
            throw new Error('multipleOf property must be an integer');
        if (decl.minimum && (decl.minimum - Math.floor(decl.minimum) > 0))
            throw new Error('minimum property must be an integer');
        if (decl.maximum && (decl.maximum - Math.floor(decl.maximum) > 0))
            throw new Error('maximum property must be an integer');
        return super.extend(decl) as NumberType;
    }

}
