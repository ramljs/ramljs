import AnyType from './AnyType';
import * as spec10 from '../spec10';
export declare class TypeLibrary {
    readonly types: {
        [index: string]: AnyType;
    };
    constructor();
    addType(decl: spec10.TypeDeclaration): AnyType;
    addTypes(declaration: spec10.TypeDeclaration[]): void;
    getType(n: string | spec10.TypeDeclaration, silent?: boolean): any;
    createType(decl: spec10.TypeDeclaration): AnyType;
}
