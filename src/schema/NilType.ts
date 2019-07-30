import Type from './Type';

export default class NilType extends Type {

    get baseType() {
        return 'nil';
    }

    protected _getJSCoercer() {
        return (v) => null;
    }

    protected _getJSONCoercer() {
        return (v) => null;
    }

}
