import {
  intIdInc,
  getForeignIntId,
  getForeignUuid,
  createdAt,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'companyCapabilities',
    {
      id: intIdInc(),
      companyId: getForeignUuid(sql.models.company, 'company_id'),
      capabilityId: getForeignIntId(sql.models.capability, 'capability_id'),
      createdAt: createdAt(),
    },
    {
      tableName: 'company_capabilities',
      updatedAt: false,
    },
  )
}

export default create
