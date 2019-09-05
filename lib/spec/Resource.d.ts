import Api from './Api';
import {ApiElement} from './common';
import TypeLibrary from '../types/TypeLibrary';
import ObjectType from '../types/ObjectType';
import * as spec10 from "../spec10";

export class HasResources {
    resources: Resource[];

    addResource(resource: spec10.Resource10);
}

export class Resource extends ApiElement, HasResources {
    displayName: string;
    relativeUri: string;
    methods: Method[];
    uriParameters: ObjectType;
    types: TypeLibrary;

    constructor(api: Api, spec: spec10.Resource10);
}

export class Method extends ApiElement {
    method: string;
    queryParameters: any;
    headers: any;
}
