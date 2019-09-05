'use strict';
const DateType = require('./DateType');

class DateTimeOnlyType extends DateType {

  get baseType() {
    return 'datetime-only';
  }

  _formatDate() {
    return (d) => {
      const s = d.toISOString();
      return s.substring(0, s.length - 1);
    };
  }

  _formatDateItems() {
    const dateItemsToISO = this._dateItemsToISO();
    return (m) => {
      const s = dateItemsToISO(m);
      return s.substring(0, s.length - 1);
    };
  }

  _matchDatePattern() {
    const PATTERN = /^(\d{4})-(0[1-9]|1[012])-([123]0|[012][1-9]|31)(?:T([01][0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?)?(?:\.?(\d+))?$/;
    return (v) => {
      const m = v.match(PATTERN);
      if (m && m[2] === '02' && m[3] > '29')
        return;
      return m;
    };
  }
}

module.exports = DateTimeOnlyType;
