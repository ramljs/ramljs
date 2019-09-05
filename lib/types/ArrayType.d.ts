import AnyType from './AnyType';
import TypeLibrary from "./TypeLibrary";
import * as spec10 from '../spec10';

export default class ArrayType extends AnyType {
    items?: AnyType;

    constructor(library?: TypeLibrary, decl?: spec10.ArrayTypeDeclaration);

}
