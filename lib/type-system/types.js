const AnyType = require('./AnyType');
const ArrayType = require('./ArrayType');
const BooleanType = require('./BooleanType');
const DateOnlyType = require('./DateOnlyType');
const TimeOnlyType = require('./TimeOnlyType');
const DateTimeOnlyType = require('./DateTimeOnlyType');
const DateTimeType = require('./DateTimeType');
const IntegerType = require('./IntegerType');
const NilType = require('./NilType');
const NumberType = require('./NumberType');
const ObjectType = require('./ObjectType');
const StringType = require('./StringType');
const UnionType = require('./UnionType');

const Types = {
  'any': AnyType,
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

module.exports = Types;
