import Router from 'router';
import {IApiDocument} from './types';
import Validator from './Validator';

export function createExpressRouter(apiDoc: IApiDocument): Router {
    const router = Router();
    const proto = Object.getPrototypeOf(Object.getPrototypeOf(router));
    const org_route = proto.route;
    // Overwrite default `route` function to handle RAML params
    proto.route = (pt) => {
        if (typeof pt === 'string') {
            pt = pt.replace(/{[^}]+}/g, (m) => {
                return ':' + m.substring(1, m.length - 1);
            });
        }
        return org_route.apply(router, [pt]);
    };

    if (!(apiDoc && apiDoc.specification &&
        Array.isArray(apiDoc.specification.resources)))
        return router;

    const enumResources = (resources, endpoints) => {
        if (!(resources && endpoints))
            return;
        for (const r of resources) {
            if (!Array.isArray(r.methods))
                continue;
            const ep = endpoints[r.relativeUri];
            // let uriParamValidator;
            for (const met of r.methods) {
                if (ep.methods && ep.methods[met.method]) {
                    /*
                    if (r.uriParameters && r.uriParameters.length) {
                        uriParamValidator = uriParamValidator ||
                            new Validator(
                                apiDoc.specification.types,
                                r.uriParameters,
                                {removeAdditional: true});
                    }*/
                    // tslint:disable-next-line:only-arrow-functions
                    router[met.method](met.parentUri, function (req, res) {
                        return ep.methods[met.method].apply(this, arguments);
                    });
                }
            }
            enumResources(r.resources, ep);
        }
    };
    enumResources(apiDoc.specification.resources, apiDoc.endpoints);

    return router;
}
