import Resource from './Resource';
import AnyType from "../type-system/AnyType";

export declare class LibraryBase {
    uses?: any;
    resourceTypes?: any;
    types: any;
    traits?: any;
    securitySchemes?: any;
    annotationTypes: { [index: string]: AnyType };
}

export declare class Library extends LibraryBase {
}
