import AnyType from './AnyType';
import TypeLibrary from './TypeLibrary';
import * as spec10 from '../spec10';

export default class NumberType extends AnyType {
    constructor(library?: TypeLibrary, decl?: spec10.NumberTypeDeclaration);
}
