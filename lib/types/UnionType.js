'use strict';
const AnyType = require('./AnyType');

class UnionType extends AnyType {

  constructor(library, decl) {
    super(library, decl);
    this.anyOf = [];
    if (decl.anyOf) {
      for (const typ of decl.anyOf) {
        this.anyOf.push(this._library.getType(typ));
      }
    }
    if (decl.typeOf) {
      if (typeof decl.typeOf !== 'function')
        throw new TypeError('decl.typeOf must be a function');
      this.typeOf = decl.typeOf;
    }
  }

  get baseType() {
    return 'union';
  }

  get typeFamily() {
    return 'union';
  }

  get storedType() {
    return (this.anyOf && this.anyOf.length && this.anyOf[0].storedType) ||
        'union';
  }

  clone() {
    const t = super.clone();
    this._mergeOnto(t, true);
    return t;
  }

  _mergeOnto(target, overwrite) {
    super._mergeOnto(target, overwrite);
    for (const k of this.anyOf) {
      const i = target.anyOf.find(y => y.name === k.name);
      if (i) {
        if (overwrite) target[i] = k;
        continue;
      }
      target.anyOf.push(k);
    }
  }

  flatten() {
    return this.anyOf.reduce((a, t) => {
      a.push(...t.flatten());
      return a;
    }, []);
  }
}

module.exports = UnionType;
