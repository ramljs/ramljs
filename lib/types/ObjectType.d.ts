import AnyType from './AnyType';
import TypeLibrary from './TypeLibrary';
import * as spec10 from '../spec10';

export default class ObjectType extends AnyType {
    properties: {
        [index: string]: AnyType;
    };
    typeOf: (t: ObjectType, value: any) => boolean;

    constructor(library?: TypeLibrary, decl?: spec10.ObjectTypeDeclaration);

}
