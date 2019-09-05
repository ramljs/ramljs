import Resource from './Resource';
import TypeLibrary from '../types/TypeLibrary';
import AnyType from "../types/AnyType";

declare class LibraryBase {
    uses?: any;
    resourceTypes?: any;
    types: TypeLibrary;
    traits?: any;
    securitySchemes?: any;
    annotationTypes: { [index: string]: AnyType };
}

export = LibraryBase;
