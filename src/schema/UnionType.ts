import Type, {InternalValidateFunction, IValidateOptions, LogFunction} from './Type';
import * as spec10 from "../spec10";

export default class UnionType extends Type {

    public anyOf?: Type[] = [];

    get baseType() {
        return 'union';
    }

    set(src: UnionType | spec10.TypeDeclaration) {
        super.set(src);
        if (Array.isArray(src.anyOf)) {
            this.anyOf = [];
            for (const typ of src.anyOf) {
                if (typ instanceof Type)
                    this.anyOf.push(typ);
                else
                    this.anyOf.push(this.library.getType(typ));
            }
        }
    }

    hasObjectType() {
        for (const x of this.anyOf) {
            if (x.baseType === 'object')
                return true;
            // @ts-ignore
            if (x.baseType === 'array' && x.hasObjectType())
                return true;
        }
        return false;
    }

    protected _generateValidateFunction(options: IValidateOptions): InternalValidateFunction {
        const superValidate = super._generateValidateFunction(options);
        const itemNames = this.anyOf.map(x => x.name);
        const itemsLen = this.anyOf.length;
        const {strictTypes, removeAdditional} = options;
        const noLog = () => void 0;
        // @ts-ignore
        const itemsPhase1 = this.anyOf.map(x => x._generateValidateFunction({
            ...options,
            strictTypes: true,
            allErrors: false,
            removeAdditional: false
        }));
        let itemsPhase2;
        let itemsPhase3;
        if (!strictTypes) {
            // @ts-ignore
            itemsPhase2 = this.anyOf.map(x => x._generateValidateFunction({
                ...options,
                allErrors: false,
                removeAdditional: false
            }));
            if (this.hasObjectType() && !removeAdditional) {
                // @ts-ignore
                itemsPhase3 = this.anyOf.map(x => x._generateValidateFunction({
                    ...options,
                    allErrors: false
                }));
            }
        }

        return (value: any, path: string, log?: LogFunction) => {
            value = superValidate(value, path, log);
            if (value === undefined)
                return;
            // Try to match exact type
            for (let i = 0; i < itemsLen; i++) {
                const v = itemsPhase1[i](value, path, noLog);
                if (v !== undefined)
                    return v;
            }

            // Try to match any type
            if (itemsPhase2) {
                for (let i = 0; i < itemsLen; i++) {
                    const v = itemsPhase2[i](value, path, noLog);
                    if (v !== undefined)
                        return v;
                }
                if (itemsPhase3) {
                    for (let i = 0; i < itemsLen; i++) {
                        const v = itemsPhase3[i](value, path, noLog);
                        if (v !== undefined)
                            return v;
                    }
                }
            }
            log({
                    message: `Value does not match any of types (${itemNames})`,
                    errorType: 'range-error',
                    path
                }
            );
        };
    }

}
