import { Error } from "raml-1-parser/dist/typings-new-format/spec-1.0/common";
import * as spec10 from "./spec10";
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
    resourceHandlers?: object;
    pathSecurity?: object;
}
export declare function loadApiFile(apiFile: string, options?: ILoadOptions): Promise<IApiDocument>;
