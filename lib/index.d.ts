import {Api, ILoadOptions} from './spec/Api';
import {Library} from './spec/Library';
import {IRouterOptions} from './expressmw';

export {Api, ILoadOptions, Library};

declare module "ramljs" {

    export function expressRouter(apiDoc: Api, options?: IRouterOptions): Promise<any>;
}

