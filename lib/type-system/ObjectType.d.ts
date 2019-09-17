import AnyType from './AnyType';
import {Library} from '../spec/Library';
import * as spec10 from '../spec10';

export default class ObjectType extends AnyType {
    properties: {
        [index: string]: AnyType;
    };
    typeOf: (t: ObjectType, value: any) => boolean;

    constructor(library?: Library, decl?: spec10.ObjectTypeDeclaration);

}
