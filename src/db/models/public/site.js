import {
  id,
  getForeignUuid,
  createdAt,
  deletedAt,
  nullable,
  name,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'site',
    {
      id: id(),
      projectId: getForeignUuid(sql.models.project, 'project_id'),
      userId: getForeignUuid(sql.models.user, 'user_id'),
      integratorId: nullable(name('integrator_id')),
      createdAt: createdAt(),
      deletedAt: deletedAt(),
    },
    {
      paranoid: true,
      updatedAt: false,
      tableName: 'sites_all',
      schema: 'public',
    },
  )
}

export default create
