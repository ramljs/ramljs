import {Api} from "./index";

export interface IRouterOptions {
    basePath: string,
    defaultErrorHandler: (err: Error, request: any, response: any, next: (err?: any) => void) => void
}

export declare function createExpressRouter(api: Api, options?: IRouterOptions): any;
