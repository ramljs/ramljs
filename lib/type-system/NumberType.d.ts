import AnyType from './AnyType';
import {Library} from '../spec/Library';
import * as spec10 from '../spec10';

export default class NumberType extends AnyType {
    constructor(library?: Library, decl?: spec10.NumberTypeDeclaration);
}
