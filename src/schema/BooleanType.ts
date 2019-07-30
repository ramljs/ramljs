import Type, {ICoerceOptions} from './Type';
import {ValidationError} from "../ValidationError";

export default class BooleanType extends Type {

    get baseType() {
        return 'boolean';
    }

    _getJSCoercer() {
        return (v: any, options?: ICoerceOptions) => {
            if (options && options.strictTypes && !(typeof v === 'boolean'))
                throw new ValidationError(
                    `Value must be a boolean`, 'Type error',
                    (options && options.location));
        };
    }

    _getJSONCoercer() {
        return this._getJSCoercer();
    }

}
