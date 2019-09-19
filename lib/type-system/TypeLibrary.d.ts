import AnyType from './AnyType';

export declare class TypeLibrary {
    readonly types: {
        [index: string]: AnyType;
    };

    constructor();

    add(...defs: any[]): void;

    get(nameOrDef: any, silent?: boolean): any;

    create(def: any): AnyType;
}

