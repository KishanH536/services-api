import {
  intIdInc,
  createdAt,
  updatedAt,
  deletedAt,
  getForeignUuid,
  getForeignCharId,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'userCompanyPermission',
    {
      id: intIdInc(),
      userId: getForeignUuid(sql.models.user, 'user_id'),
      companyId: getForeignUuid(sql.models.company, 'company_id'),
      permissionId: getForeignCharId(sql.models.permission, 'permission_id'),
      createdAt: createdAt(),
      updatedAt: updatedAt(),
      deletedAt: deletedAt(),
    },
    {
      tableName: 'user_companies_permissions',
    },
  )
}

export default create
