import {loadApiFile, ILoadOptions} from './apiLoader';
import {TypeLibrary} from './types/TypeLibrary';
import {ApiDoc} from './ApiDoc';

export {
    ILoadOptions,
    ApiDoc,
    TypeLibrary
};

export async function expressRouter(apiDoc: ApiDoc) {
    const {createExpressRouter} = await import('./expressmw');
    return createExpressRouter(apiDoc);
}
