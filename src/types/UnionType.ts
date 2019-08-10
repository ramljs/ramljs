import AnyType, {InternalValidateFunction, IValidateOptions, LogFunction} from './AnyType';
import * as spec10 from "../spec10";

export default class UnionType extends AnyType {

    public anyOf?: AnyType[];

    get baseType(): string {
        return 'union';
    }

    get typeFamily(): string {
        return 'union';
    }

    get storedType(): string {
        return (this.anyOf && this.anyOf.length && this.anyOf[0].baseType) || 'union';
    }

    extend(decl: spec10.StringTypeDeclaration): UnionType {
        const inst = super.extend(decl) as UnionType;
        if (decl.anyOf) {
            this.anyOf = [];
            for (const typ of decl.anyOf) {
                this.anyOf.push(this.library.getType(typ));
            }
        }
        return inst;
    }

    protected _generateValidator(options: IValidateOptions): InternalValidateFunction {
        const superValidate = super._generateValidator(options);
        const itemNames = this.anyOf.map(x => x.name);
        const itemsLen = this.anyOf.length;
        const {removeAdditional} = options;
        const storedType = this.storedType;
        const noLog = () => void 0;
        // @ts-ignore
        const itemsPhase1 = this.anyOf.map(x => x._generateValidator({
            ...options,
            allErrors: false,
            removeAdditional: false
        }));
        let itemsPhase2;
        if (storedType === 'object' && !removeAdditional) {
            // @ts-ignore
            itemsPhase2 = this.anyOf.map(x => x._generateValidator({
                ...options,
                allErrors: false
            }));
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
