import Type from './Type';

import * as spec10 from "../spec10";
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

const internalTypes = {
    'array': ArrayType,
    'boolean': BooleanType,
    'date-only': DateOnlyType,
    'time-only': TimeOnlyType,
    'datetime-only': DateTimeOnlyType,
    'datetime': DateTimeType,
    'integer': IntegerType,
    'nil': NilType,
    'number': NumberType,
    'object': ObjectType,
    'string': StringType,
    'union': UnionType
};

export class Library {

    private readonly _internalTypes: Map<string, Type> = new Map<string, Type>();
    public readonly types: Map<string, Type> = new Map<string, Type>();

    constructor() {
        this._internalTypes = new Map();
        for (const k of Object.keys(internalTypes)) {
            this._internalTypes.set(k, new internalTypes[k](this, k));
        }
    }

    addType(...declaration: spec10.TypeDeclaration[]) {
        const orgGetType = this.getType;
        const creating = {};
        try {
            this.getType = (n: spec10.TypeReference10) => {
                const t = orgGetType.call(this, n, true);
                if (t)
                    return t;
                if (typeof n === 'string') {
                    const fn = creating[n];
                    if (fn) {
                        delete creating[n];
                        return fn();
                    }
                }
            };
            // Check if types already defined
            for (const decl of declaration) {
                if (this.types.has(decl.name) || creating[decl.name])
                    throw new Error(`${decl.name} already defined in library`);
                creating[decl.name] = () => {
                    const t = this.createType(decl);
                    this.types.set(decl.name, t);
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

    getType(n: spec10.TypeReference10, silent?: boolean) {
        const t = typeof n === 'string' ?
            this.types.get(n) || this._internalTypes.get(n) :
            this.createType(n);
        if (!(t || silent))
            throw new Error(`Type "${n}" not found`);
        return t;
    }

    createType(decl: spec10.TypeDeclaration): Type {
        let inst;
        const types = decl.type ?
            (Array.isArray(decl.type) ? decl.type : [decl.type]) : ['object'];
        for (const n of types) {
            const baseType = this.getType(n);
            if (inst)
                inst.set(baseType);
            else inst = baseType.extend(decl.name);
        }
        inst.set(decl);
        return inst;
    }

}
