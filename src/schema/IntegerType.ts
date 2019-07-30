import NumberType from './NumberType';
import Library from "./Library";

export default class IntegerType extends NumberType {

    constructor(library: Library, name: string) {
        super(library, name);
        this.format = 'int';
    }

    get baseType() {
        return 'integer';
    }

}
