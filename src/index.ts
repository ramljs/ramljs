import {ILoadOptions, IApiDocument} from './types';
import {loadApiFile, loadApiContent} from './loadRamlApi';
import {Library} from './schema/Library';

export {
    ILoadOptions,
    IApiDocument,
    loadApiFile,
    loadApiContent,
    Library
};

export async function expressRouter(api: IApiDocument,
                                    options: object) {
    const {createExpressRouter} = await import('./expressmw');
    return createExpressRouter(api);
}
