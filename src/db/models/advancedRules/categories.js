import {
  getForeignUuid,
  primary,
  detectionClass,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'categories',
    {
      ruleId: primary(getForeignUuid(sql.models.advancedRule, 'rule_id')),
      category: primary(detectionClass()),
    },
    {
      tableName: 'categories',
      schema: 'advanced_rules',
      createdAt: false,
      updatedAt: false,
      deletedAt: false,
    },
  )
}

export default create
