import AnyType from './AnyType';
import {Library} from '../spec/Library';
import * as spec10 from '../spec10';

export default class ArrayType extends AnyType {
    items?: AnyType;

    constructor(library?: Library, decl?: spec10.ArrayTypeDeclaration);

}
