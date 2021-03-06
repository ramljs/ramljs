/* tslint:disable:interface-name */
export * from "raml-1-parser/dist/typings-new-format/spec-1.0/api";
export * from "raml-1-parser/dist/typings-new-format/spec-1.0/datamodel";
export * from "raml-1-parser/dist/typings-new-format/spec-1.0/resources";
export * from "raml-1-parser/dist/typings-new-format/spec-1.0/methods";
import * as datamodel from "raml-1-parser/dist/typings-new-format/spec-1.0/datamodel";

export interface TypeDeclaration extends datamodel.TypeDeclaration {
    example?: string;
}

export interface DateTypeDeclaration extends datamodel.TypeDeclaration {
    format?: 'rfc3339' | 'rfc2616';
}
