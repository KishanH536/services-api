import {
  createdAt,
  intIdInc,
  jsonb,
  text,
  uuid,
  validate,
  string,
} from '../../columns.js'

const userType = new Set([
  'super-admin',
  'admin',
  'member',
  'operator',
  'key-holder',
  'installer',
  'program',
])

function create(sql) {
  sql.define(
    'auditLog',
    {
      id: intIdInc(),
      userId: uuid('user_id'),
      siteId: uuid('site_id'),
      projectId: uuid('project_id'),
      companyId: uuid('company_id'),
      objectId: text('object_id'),
      objectType: text('object_type'),
      parentType: text('parent_type'),
      parentId: text('parent_id'),
      operation: text(),
      directory: text(),
      change: text(),
      v0: jsonb(),
      v1: jsonb(),
      createdAt: createdAt(),
      meta: jsonb(),
      userType: validate({ isIn: [[...userType]] })(string('user_type')),
    },
    {
      tableName: 'audit_log',
      paranoid: true,
      schema: 'public',
    },
  )
}

export default create
