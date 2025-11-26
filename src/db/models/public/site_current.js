import {
  id,
  name,
  getForeignUuid,
  jsonb,
  updatedAt,
  createdAt,
  adapterType,
  nullable,
  timezone,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'siteCurrent',
    {
      id: id(),
      projectId: getForeignUuid(sql.models.project, 'project_id'),
      userId: getForeignUuid(sql.models.user, 'user_id'),
      integratorId: nullable(name('integrator_id')),
      name: name(),
      type: adapterType(),
      fields: jsonb(),
      timezone: timezone(),
      createdAt: createdAt(),
      updatedAt: updatedAt(),
    },
    {
      timestamps: false,
      tableName: 'site_currents',
      schema: 'public',
    },
  )
}

export default create
