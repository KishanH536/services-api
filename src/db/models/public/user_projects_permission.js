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
    'userProjectPermission',
    {
      id: intIdInc(),
      userId: getForeignUuid(sql.models.user, 'user_id'),
      projectId: getForeignUuid(sql.models.project, 'project_id'),
      permissionId: getForeignCharId(sql.models.permission, 'permission_id'),
      createdAt: createdAt(),
      updatedAt: updatedAt(),
      deletedAt: deletedAt(),
    },
    {
      tableName: 'user_projects_permissions',
    },
  )
}

export default create
