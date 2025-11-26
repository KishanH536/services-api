import {
  intIdInc,
  createdAt,
  updatedAt,
  deletedAt,
  getForeignUuid,
  getForeignCharId,
  nullable,
  jsonb,
  text,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'userSitePermission',
    {
      id: intIdInc(),
      userId: getForeignUuid(sql.models.user, 'user_id'),
      siteId: getForeignUuid(sql.models.site, 'site_id'),
      permissionId: getForeignCharId(sql.models.permission, 'permission_id'),
      displayName: text('display_name'),
      createdAt: createdAt(),
      updatedAt: updatedAt(),
      deletedAt: deletedAt(),
      rules: nullable(jsonb('rules')),
    },
    {
      tableName: 'user_sites_permissions',
    },
  )
}

export default create
