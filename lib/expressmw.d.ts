import {Api} from "./index";

export interface IRouterOptions {
    defaultErrorHandler: (err: Error, request: any, response: any, next: (err?: any) => void) => void
}

export declare function createExpressRouter(api: Api, options?: IRouterOptions): any;
