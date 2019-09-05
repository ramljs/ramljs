import Api = require("./Api");

export declare class ApiElement {
    parent: ApiElement;
    api: Api;

    constructor(parent: ApiElement, spec?);
}

export declare class Secured {
    securedBy: any[];
}

export declare function implement(target: object, ...source: object[]);
