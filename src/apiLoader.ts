import * as ramlParser from 'raml-1-parser';
import path from 'path';
import fs from 'fs';
import glob from 'glob';
import stringReplaceAsync from 'string-replace-async';
import {Error} from "raml-1-parser/dist/typings-new-format/spec-1.0/common";
import * as spec10 from "./spec10";

type Maybe<T> = T | null | undefined;

export interface ILoadOptions {
    filePath?: string;
    resolveFile?: (path: string) => Promise<string>;
    resolveHttp?: (path: string) => Promise<string>;
}

export interface IApiDocument {
    ramlVersion: string;
    type: string;
    errors?: Error[];
    specification: spec10.Api10;
    resourceHandlers?: object;
    pathSecurity?: object;
}

export async function loadApiFile(apiFile: string,
                                  options: ILoadOptions = {}): Promise<IApiDocument> {
    const content = await retrieveFile(apiFile, options);
    return loadApiContent(content, {
        ...options,
        filePath: options.filePath || apiFile
    });
}

async function loadApiContent(apiContent: string | { spec: string },
                              options: ILoadOptions = {}): Promise<IApiDocument> {
    if (typeof apiContent === 'string')
        apiContent = {spec: apiContent};

    if (!(typeof apiContent.spec === 'string' &&
        apiContent.spec.match(/^[\n ]*#%RAML/)))
        throw new TypeError('Invalid RAML spec');
    const apiRoot = path.dirname(options.filePath) || '/';
    const resourceHandlers = {};
    const pathSecurity = {};

    const resolveRAML = async (file: string) => {
        let v = await retrieveFile(file, options);
        if (!v)
            return v;
        if (typeof v === 'string')
            return processReplace(file, v);

        if (typeof v === 'object') {
            if (typeof v.spec !== 'string')
                throw new Error('Invalid file');
            v = Object.assign({}, v);
            v.spec = await processReplace(file, v.spec);
            return v;
        }
        return v;
    };

    const processReplace = async (file: string, content: string) => {
        const curDir = path.dirname(file);

        // Bulk includes
        content = await stringReplaceAsync(content, /\n( *)!include_all *([^\n]*)/,
            async (m, indent, ff) => {
                const dir = path.join((ff.startsWith('/') ? apiRoot : curDir), ff);
                const files = glob.sync(glob.hasMagic(dir) ? dir : path.join(dir, '**/*'));
                let r = '';
                for (const f of files) {
                    path.join(curDir);
                    // Remove file extension
                    const x = path.join(path.dirname(f), path.basename(f, path.extname(f)));
                    r += '\n' + indent + path.basename(x) +
                        ': !include ' + path.relative(curDir, x);
                }
                return r;
            });

        // Resource tree
        content = await stringReplaceAsync(content, /\n( *)!resources *([^\n\s]*)/, async (s, indent, ff) => {
            const root = path.join((ff.startsWith('/') ? apiRoot : curDir), ff);
            if (!fs.statSync(root).isDirectory())
                throw new Error(`"${root}" does not exists`);
            const visitPath = async (node, dir) => {
                const files = fs.readdirSync(dir);
                for (const f of files) {
                    const filePath = path.join(dir, f);
                    if (!fs.statSync(filePath).isFile())
                        continue;
                    const basename = path.basename(filePath, path.extname(filePath));
                    const o = node['/' + basename] = (node['/' + basename] || {});
                    const v = await resolveRAML(filePath);
                    if (typeof v === 'object')
                        Object.assign(o, v);
                    if (typeof v === 'string')
                        o.spec = v;
                }
                for (const f of files) {
                    const filePath = path.join(dir, f);
                    const stat = fs.statSync(filePath);
                    if (stat.isDirectory())
                        node['/' + f] =
                            await visitPath(node['/' + f] || {}, filePath);
                }
                return node;
            };
            let r = '';
            const visitNode = (src, curPath = '', ind = '') => {
                for (const k of Object.keys(src)) {
                    if (k.startsWith('/')) {
                        // Merge spec into single
                        let spec = (src[k].spec || '');
                        if (spec) {
                            const m = spec.match(/( *)\w+/);
                            if (m) {
                                spec = spec.replace(/\s+/, '');
                                spec = spec.replace(new RegExp('\\n' + m[1], 'g'), '\n');
                            }
                            spec = spec && spec.replace(/(^|\n)/g, ('\n' + ind + '  '));
                        }
                        r += `\n${ind}${k}:` + spec;

                        if (src[k].methods)
                            resourceHandlers[curPath + k] = src[k].methods;
                        if (src[k].pathSecurity)
                            pathSecurity[curPath + k] = src[k].pathSecurity;

                        visitNode(src[k], curPath + k, ind + '  ');
                    }
                }
            };
            const tree = await visitPath({}, root);
            visitNode(tree);
            return r;
        });
        return content;
    };

    const ramlSpec = (await processReplace(options.filePath, apiContent.spec));

    const result = (await ramlParser.load(ramlSpec, {
        filePath: options.filePath,
        fsResolver: {
            content: null,
            async contentAsync(p: string): Promise<string> {
                const v = await resolveRAML(p);
                return typeof v === 'object' ? v.spec.trim() :
                    typeof v === 'string' ? v.trim() : v;
            }
        }
    })) as IApiDocument;
    if (result.errors && result.errors.length) {
        const err = new Error(result.errors[0].message);
        // @ts-ignore
        err.errors = result.errors;
        throw err;
    }
    delete result.errors;
    result.resourceHandlers = resourceHandlers;
    result.pathSecurity = pathSecurity;
    return result;
}

async function retrieveFile(pathOrUrl, options: ILoadOptions): Promise<Maybe<string | { spec: string }>> {
    let v;
    if (options.resolveFile)
        v = await options.resolveFile.call(null, pathOrUrl);
    if (v === undefined) {
        const ext = path.extname(pathOrUrl).toLowerCase();
        if (!ext && fs.existsSync(pathOrUrl + '.js'))
            return retrieveFile(pathOrUrl + '.js', options);
        if (!ext && fs.existsSync(pathOrUrl + '.raml'))
            return retrieveFile(pathOrUrl + '.raml', options);
        if (ext === '.js') {
            const o = await import(pathOrUrl);
            return o.default || o;
        }
        return fs.readFileSync(pathOrUrl, 'utf8');
    }
    return v;
}
