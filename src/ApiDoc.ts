import ObjectType from "../../lib/types/ObjectType";

const util = require('util');
import {TypeLibrary} from './types/TypeLibrary';
import {loadApiFile, ILoadOptions} from './apiLoader';
import AnyType, {ValidateFunction} from './types/AnyType';
import * as spec10 from "./spec10";

type Maybe<T> = T | void;

export class ApiDoc {

    title?: string;
    description?: string;
    version?: string;
    baseUri?: string;
    resources: { [index: string]: ApiResource };
    types: TypeLibrary;

    constructor(doc) {
        if (doc && doc.specification)
            this._loadDoc(doc);
    }

    private _loadDoc(doc) {
        this.resources = {};
        this.types = new TypeLibrary();
        if (doc.specification) {
            const spec = doc.specification;
            this.title = spec.title;
            this.description = spec.description;
            this.version = spec.version;
            this.baseUri = spec.baseUri;
            if (spec.types)
                this.types.addTypes(doc.specification.types);
            if (spec.resources) {
                for (const res of spec.resources)
                    this.resources[res.relativeUri] = new ApiResource(this, res);
            }
        }

    }

    static async load(apiFile: string,
                      options: ILoadOptions = {}): Promise<ApiDoc> {
        const doc = await loadApiFile(apiFile, options);
        console.log(util.inspect(doc, null, 20, true));
        // return new ApiDoc(doc);
    }

}

class ApiResource {
    spec: spec10.Resource10;
    methods: ApiResourceMethod[];
    resources: { [index: string]: ApiResource };
    uriParameters: ObjectType;
    types: TypeLibrary;

    constructor(doc: ApiDoc, spec: spec10.Resource10) {
        this.spec = spec;
        this.resources = {};
        this.methods = [];
        if (spec.uriParameters) {
            const o = {
                name: 'uriParameters',
                additionalProperties: true,
                properties: {}
            };
            for (const prm of spec.uriParameters)
                o.properties[prm.name] = prm;
            // @ts-ignore
            this.uriParameters = doc.types.createType(o);
        }
        if (spec.methods) {
            for (const res of spec.methods)
                this.methods.push(new ApiResourceMethod(doc, res));
        }
        if (spec.resources) {
            for (const res of spec.resources)
                this.resources[res.relativeUri] = new ApiResource(doc, res);
        }
    }

}

class ApiResourceMethod {
    spec: spec10.Method10;
    method: string;
    queryParameters: ObjectType;
    headers: ObjectType;
    handler: () => void;

    constructor(doc: ApiDoc, spec: spec10.Method10) {
        if (spec.queryParameters) {
            const o = {
                name: 'queryParameters',
                additionalProperties: true,
                properties: {}
            };
            for (const prm of spec.queryParameters)
                o.properties[prm.name] = prm;
            // @ts-ignore
            this.queryParameters = doc.types.createType(o);
        }
        if (spec.headers) {
            const o = {
                name: 'headers',
                additionalProperties: true,
                properties: {}
            };
            for (const prm of spec.headers)
                o.properties[prm.name] = prm;
            // @ts-ignore
            this.headers = doc.types.createType(o);
        }
    }
}

/*
securityHandler: (req: object, scopes?: string[]) => Maybe<any>;

queryParametersCoercer: ValidateFunction;

const o = {
                type: ['object'],
                name: 'uriParameters',
                displayName: 'uriParameters',
                additionalProperties: true,
                properties: {}
            };

            const t = doc.types.createType(o);
            this.uriParametersCoercer = t.validator({coerceTypes: true});
 */
