import Sequelize from 'sequelize'
import { identity } from 'lodash-es'

const id = (field) => ({
  field,
  type: Sequelize.UUID,
  defaultValue: Sequelize.UUIDV4,
  primaryKey: true,
  unique: true,
  allowNull: false,
})

const idInc = (type, field) => ({
  type,
  field,
  allowNull: false,
  primaryKey: true,
  unique: true,
  autoIncrement: true,
})

const idChar = (field) => ({
  type: Sequelize.CHAR(100),
  field,
  allowNull: false,
  primaryKey: true,
  unique: true,
})

const idText = (field) => ({
  type: Sequelize.TEXT('medium'),
  field,
  allowNull: false,
  primaryKey: true,
  unique: true,
})

const dateField = (field) => ({
  type: Sequelize.DATE,
  field,
  allowNull: true,
})

const dateOnlyField = (field) => ({
  type: Sequelize.DATEONLY,
  field,
  allowNull: false,
})

const priority = () => ({
  type: Sequelize.SMALLINT,
  defaultValue: 5,
})

// to get consistent camelCase in code and snake_case in DB tables
const createdAt = () => ({
  field: 'created_at',
  type: Sequelize.DATE,
})

const updatedAt = () => ({
  field: 'updated_at',
  type: Sequelize.DATE,
})

const deletedAt = () => ({
  field: 'deleted_at',
  type: Sequelize.DATE,
})

const get = (type, col, getter = identity) => ({
  ...type,
  get() {
    const rawValue = this.getDataValue(col)
    return getter(rawValue)
  },
})

const getForeignId = (type, model, field) => ({
  type,
  allowNull: false,
  references: {
    model,
    // primary keys are always called 'id'
    key: 'id',
  },
  field,
})

const primary = (type) => ({
  ...type,
  primaryKey: true,
})

const req = (type) => ({
  ...type,
  allowNull: false,
})

const nullable = (type) => ({
  ...type,
  allowNull: true,
})

const unique = (type) => ({
  ...type,
  unique: true,
})

const nonBindedDefaultValue = (value, type) => ({
  ...type,
  defaultValue: value,
})

const validate = (v, type) => ({
  ...type,
  validate: v,
})

function chain(...args) {
  const fstArg = args.pop()
  return args.reduceRight((arg, f) => f(arg), fstArg)
}

function willBindAll(f, that) {
  return function (...args) {
    return f.bind(that, ...args)
  }
}

const typeFactory = (type) =>
  (field) => field
    ? {
      field,
      type,
    }
    : {
      type,
    }

const intIdInc = idInc.bind(null, Sequelize.INTEGER)
const smallIdInc = idInc.bind(null, Sequelize.SMALLINT)
const uuid = typeFactory(Sequelize.UUID)
const integer = typeFactory(Sequelize.INTEGER)
const smallInt = typeFactory(Sequelize.SMALLINT)
const double = typeFactory(Sequelize.DOUBLE)
const name = typeFactory(Sequelize.STRING)
const email = typeFactory(Sequelize.STRING(100))
const password = typeFactory(Sequelize.STRING(60))
const bool = typeFactory(Sequelize.BOOLEAN)
const blob = typeFactory(Sequelize.BLOB)
const json = typeFactory(Sequelize.JSON)
const jsonb = typeFactory(Sequelize.JSONB)
const s3key = typeFactory(Sequelize.STRING(100))
const token = typeFactory(Sequelize.STRING(100))
const smallIntArray = typeFactory(Sequelize.ARRAY(Sequelize.SMALLINT))
const url = typeFactory(Sequelize.STRING(2048))
const date = typeFactory(Sequelize.DATE)
const text = typeFactory(Sequelize.TEXT('medium'))
const filePath = typeFactory(Sequelize.STRING(255))
const host = typeFactory(Sequelize.STRING(255))
const timezone = typeFactory(Sequelize.STRING(28))
const emailArray = typeFactory(Sequelize.ARRAY(Sequelize.STRING(100)))
const string = typeFactory(Sequelize.STRING)
const mainPlanType = typeFactory(Sequelize.ENUM(
  'alarm',
  'camera',
))
const adapterType = typeFactory(Sequelize.ENUM(
  'api',
))
const detectionClass = typeFactory(Sequelize.ENUM(
  'cyclist',
  'car',
  'truck',
  'person',
  'construction_vehicle',
))
const tamperingStatus = typeFactory(Sequelize.ENUM(
  'new',
  'progress',
  'completed',
  'failed',
  'skipped',
))

const defaultValue = willBindAll(nonBindedDefaultValue)
const getForeignIntId = getForeignId.bind(null, Sequelize.INTEGER)
const getForeignSmallIntId = getForeignId.bind(null, Sequelize.SMALLINT)
const getForeignUuid = getForeignId.bind(null, Sequelize.UUID)
const getForeignCharId = getForeignId.bind(null, Sequelize.CHAR)

export {
  id,
  idInc,
  idChar,
  idText,
  intIdInc,
  smallIdInc,
  getForeignId,
  uuid,
  integer,
  smallInt,
  double,
  name,
  email,
  password,
  bool,
  blob,
  json,
  jsonb,
  s3key,
  token,
  smallIntArray,

  // https://stackoverflow.com/questions/2659952/maximum-length-of-http-get-request
  url,
  date,
  text,
  filePath,

  /*
   * 255 max dns length
   * https://stackoverflow.com/questions/32290167/what-is-the-maximum-length-of-a-dns-name
   */
  host,
  getForeignIntId,
  getForeignSmallIntId,
  getForeignUuid,
  getForeignCharId,
  timezone,
  priority,
  createdAt,
  updatedAt,
  deletedAt,
  req,
  nullable,
  unique,
  defaultValue,
  get,
  validate, // : willBindAll(validate),
  chain,
  primary,
  typeFactory,
  dateField,
  dateOnlyField,
  emailArray,
  string,
  mainPlanType,
  adapterType,
  detectionClass,
  tamperingStatus,
}
