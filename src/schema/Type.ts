import * as spec10 from "../spec10";
import Library from "./Library";
import {ValidationError} from "../ValidationError";

export type CoerceFunction = (v: any, options?: ICoerceOptions) => any;

export interface ICoerceOptions {
    ignoreRequired?: boolean;
    coerceDates?: boolean;
    location?: string;
    strictTypes?: boolean;
}

export default class Type {

    private _jsCoercer: CoerceFunction;
    private _jsonCoercer: CoerceFunction;
    public library: Library;
    public name: string;
    public required?: boolean;
    public default?: any;
    public annotations: { [index: string]: any };

    constructor(library: Library, name: string) {
        this.library = library;
        this.name = name;
    }

    // noinspection JSMethodCanBeStatic
    get baseType() {
        return null;
    }

    mix(src: Type | spec10.TypeDeclaration) {
        this._jsCoercer = undefined;
        if (src.required !== undefined)
            this.required = src.required;
        if (src.default !== undefined)
            this.default = src.default;
        if (Array.isArray(src.annotations)) {
            this.annotations = this.annotations || {};
            src.annotations.forEach(x => {
                this.annotations[x.name] = x.value;
            });
        }
    }

    toJS(v, options?: ICoerceOptions) {
        const coercer = this._jsCoercer =
            (this._jsCoercer = this.getJSCoercer());
        return coercer(v, options);
    }

    toJSON(v, options?: ICoerceOptions) {
        const coercer = this._jsonCoercer =
            (this._jsonCoercer = this.getJSONCoercer());
        return coercer(v, options);
    }

    extend(name) {
        const clz = Object.getPrototypeOf(this).constructor;
        const inst = new clz(this.library, name);
        inst.mix(this);
        return inst;
    }

    getJSCoercer(): CoerceFunction {
        const coercer = this._getJSCoercer();
        const {required} = this;
        return (v: any, options?: ICoerceOptions) => {
            v = v == null ? null : coercer(v, options);
            if (required && v == null && !(options && options.ignoreRequired))
                throw new ValidationError('Value required', 'Value required error',
                    (options && options.location));
            return v;
        };
    }

    getJSONCoercer(): CoerceFunction {
        const coercer = this._getJSONCoercer();
        const {required} = this;
        return (v: any, options?: ICoerceOptions) => {
            v = v == null ? null : coercer(v, options);
            if (required && v == null && !(options && options.ignoreRequired))
                throw new ValidationError('Value required', 'Value required error',
                    (options && options.location));
            return v;
        };
    }

    protected _getJSCoercer(): CoerceFunction {
        return (v) => v;
    }

    protected _getJSONCoercer(): CoerceFunction {
        return (v) => v;
    }

    protected _copyProperties(src, properties) {
        properties.forEach(x => {
            if (src[x] === null)
                delete this[x];
            else if (src[x] !== undefined)
                this[x] = src[x];
        });
    }

}
