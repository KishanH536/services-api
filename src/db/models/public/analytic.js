import {
  intIdInc,
  getForeignIntId,
  getForeignUuid,
  jsonb,
  createdAt,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'analytics',
    {
      id: intIdInc(),
      viewId: getForeignUuid(sql.models.views, 'view_id'),
      capabilityId: getForeignIntId(sql.models.capability, 'capability_id'),
      config: jsonb(),
      createdAt: createdAt(),
    },
    {
      tableName: 'analytics',
      updatedAt: false,
    },
  )
}

export default create
