'use strict';
const DateType = require('./DateType');

class DateOnlyType extends DateType {

  get baseType() {
    return 'date-only';
  }

  _formatDate() {
    return (d) => {
      const s = d.toISOString();
      return s.substring(0, 10);
    };
  }

  _formatDateItems() {
    const dateItemsToISO = this._dateItemsToISO();
    return (m) => {
      const s = dateItemsToISO(m);
      return s.substring(0, 10);
    };
  }

  _matchDatePattern() {
    const PATTERN = /^(\d{4})-(0[1-9]|1[012])-([123]0|[012][1-9]|31)$/;
    return (v) => {
      const m = v.match(PATTERN);
      if (m && m[2] === '02' && m[3] > '29')
        return;
      return m;
    };
  }
}

module.exports = DateOnlyType;
