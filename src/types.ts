import {Error} from "raml-1-parser/dist/typings-new-format/spec-1.0/common";
import * as spec10 from "./spec10";

export type Maybe<T> = T | undefined | null;

export interface ILoadOptions {
    filePath?: string;
    resolveFile?: (path: string) => Promise<string>;
    resolveHttp?: (path: string) => Promise<string>;
}

export interface IApiDocument {
    ramlVersion: string;
    type: string;
    errors?: Error[];
    specification: spec10.Api10;
    endpoints: { [index: string]: IEndpoint };
}

export interface IEndpoint {
    methods: IMethodHandlers;
    securityHandler: (req: object, scopes?: string[]) => Maybe<any>;
    resolveFile?: (path: string) => Promise<string>;
    resolveHttp?: (path: string) => Promise<string>;
}

export interface IMethodHandlers {
    [index: string]: (...any) => Maybe<any>;
}
