import TypeLibrary from './types/TypeLibrary';
import {Api, ILoadOptions} from './spec/Api';
import {IRouterOptions} from './expressmw';

export {Api, ILoadOptions, TypeLibrary};

export declare function expressRouter(apiDoc: Api, options?: IRouterOptions): Promise<any>;
