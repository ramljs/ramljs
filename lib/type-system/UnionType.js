'use strict';
const AnyType = require('./AnyType');

class UnionType extends AnyType {

  constructor(library, def) {
    super(library, def);
    this.anyOf = def.anyOf ?
        def.anyOf.map(def => this._library.get(def)) : [];
  }

  get baseType() {
    return 'union';
  }

  get subType() {
    return (this.anyOf && this.anyOf.length && this.anyOf[0].subType) || 'any';
  }

  clone() {
    const t = super.clone();
    t.anyOf.push(...this.anyOf);
    return t;
  }

  _copyTo(target, overwrite) {
    super._copyTo(target, overwrite);
    target.anyOf.push(...this.anyOf.filter(x => !target.anyOf.includes(x)));
  }

  flatten() {
    return this.anyOf.reduce((a, t) => {
      a.push(...t.flatten());
      return a;
    }, []);
  }
}

module.exports = UnionType;
