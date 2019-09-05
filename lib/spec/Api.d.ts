import TypeLibrary from '../types/TypeLibrary';
import LibraryBase from './LibraryBase';
import {HasResources} from './Resource';
import {Secured} from './common';

export interface ILoadOptions {
    filePath?: string;
    resolveFile?: (path: string) => Promise<string>;
    resolveHttp?: (path: string) => Promise<string>;
}

export declare class Api extends LibraryBase, Secured, HasResources {
    title?: string;
    description?: string;
    version?: string;
    baseUri?: string;
    baseUriParameters: TypeLibrary;
    protocols: string[];
    mediaType?: string;
    documentation?: string;

    static load(apiFile: string, options?: ILoadOptions): Promise<Api>;
}
