import {LibraryBase} from './Library';
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
    // baseUriParameters: TypeMap;
    protocols: string[];
    mediaType?: string;
    documentation?: string;

    static load(apiFile: string, options?: ILoadOptions): Promise<Api>;
}
