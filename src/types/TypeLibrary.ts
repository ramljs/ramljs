/* tslint:disable:object-literal-key-quotes */
import AnyType from './AnyType';

import * as spec10 from '../spec10';
import ArrayType from './ArrayType';
import BooleanType from './BooleanType';
import DateOnlyType from './DateOnlyType';
import TimeOnlyType from './TimeOnlyType';
import DateTimeOnlyType from './DateTimeOnlyType';
import DateTimeType from './DateTimeType';
import IntegerType from './IntegerType';
import NilType from './NilType';
import NumberType from './NumberType';
import ObjectType from './ObjectType';
import StringType from './StringType';
import UnionType from './UnionType';

let builtInTypes: TypeLibrary;

export class TypeLibrary {

    public readonly types: { [index: string]: AnyType };

    constructor() {
        this.types = {};
    }

    addType(decl: spec10.TypeDeclaration) {
        if (this.types[decl.name])
            throw new Error(`${decl.name} already defined in library`);
        const t = this.createType(decl);
        this.types[decl.name] = t;
        return t;
    }

    addTypes(declaration: spec10.TypeDeclaration[]) {
        const orgGetType = this.getType;
        const creating = {};
        try {
            this.getType = (n: string) => {
                const t = orgGetType.call(this, n, true);
                if (t)
                    return t;
                const fn = creating[n];
                if (fn) {
                    delete creating[n];
                    return fn();
                }
            };
            // Check if types are already defined
            for (const decl of declaration) {
                if (this.types[decl.name] || creating[decl.name])
                    throw new Error(`${decl.name} already defined in library`);
                creating[decl.name] = () => {
                    const t = this.createType(decl);
                    this.types[decl.name] = t;
                    return t;
                };
            }
            for (const k of Object.keys(creating)) {
                const x = creating[k];
                if (x) x();
            }
        } finally {
            // Restore original getType function
            delete this.getType;
        }
    }

    getType(n: string | spec10.TypeDeclaration, silent?: boolean) {
        const t = typeof n === 'string' ?
            this.types[n] || (this !== builtInTypes && builtInTypes.getType(n)) :
            this.createType(n);
        if (!(t || silent))
            throw new Error(`Type "${n}" not found`);
        return t;
    }

    createType(decl: spec10.TypeDeclaration): AnyType {
        const t = decl.type ?
            (Array.isArray(decl.type) ? decl.type[0] : decl.type) :
            // @ts-ignore
            (decl.properties ? 'object' : 'string');
        const base = this.getType(this.getType(t).storedType);
        const Clazz = Object.getPrototypeOf(base).constructor;
        return new Clazz(this, decl);
    }

}

builtInTypes = new TypeLibrary();
Object.assign(builtInTypes.types,
    {
        'any': new AnyType(builtInTypes, {name: 'any'} as any),
        'array': new ArrayType(builtInTypes, {name: 'array'} as any),
        'boolean': new BooleanType(builtInTypes, {name: 'boolean'} as any),
        'date-only': new DateOnlyType(builtInTypes, {name: 'date-only'} as any),
        'time-only': new TimeOnlyType(builtInTypes, {name: 'time-only'} as any),
        'datetime-only': new DateTimeOnlyType(builtInTypes, {name: 'datetime-only'} as any),
        'datetime': new DateTimeType(builtInTypes, {name: 'datetime'} as any),
        'integer': new IntegerType(builtInTypes, {name: 'integer'} as any),
        'nil': new NilType(builtInTypes, {name: 'nil'} as any),
        'number': new NumberType(builtInTypes, {name: 'number'} as any),
        'object': new ObjectType(builtInTypes, {name: 'object'} as any),
        'string': new StringType(builtInTypes, {name: 'string'} as any),
        'union': new UnionType(builtInTypes, {name: 'union'} as any),
    });
