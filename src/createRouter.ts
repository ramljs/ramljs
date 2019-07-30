import Router from 'router';

export default function createRouter(apiDoc) {
    const r = Router();
    const org_route = r.route;
    r.route = (pt) => {
        if (typeof pt === 'string') {
            pt = pt.replace(/{[^}]+}/g, (m) => {
                return ':' + m.substring(1, m.length - 1);
            });
        }
        return org_route.apply(r, [pt]);
    };
    return r;
}
