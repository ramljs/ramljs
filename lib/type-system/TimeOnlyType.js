'use strict';
const DateType = require('./DateType');

class TimeOnlyType extends DateType {

  get baseType() {
    return 'time-only';
  }

  _formatDate() {
    return (d) => {
      const s = d.toISOString();
      return s.substring(11, s.length - 1);
    };
  }

  _formatDateItems() {
    const dateItemsToISO = this._dateItemsToISO();
    return (m) => {
      const s = dateItemsToISO(m);
      return s.substring(11, s.length - 1);
    };
  }

  _matchDatePattern() {
    const PATTERN = /^([01][0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?(?:\.?(\d+))?$/;
    return (v) => {
      const m = v.match(PATTERN);
      return m ? [v, '1970', '01', '01', ...m.slice(1)] : m;
    };
  }
}

module.exports = TimeOnlyType;
