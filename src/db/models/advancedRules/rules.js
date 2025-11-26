import {
  id,
  name,
  createdAt,
  updatedAt,
  getForeignUuid,
  smallInt,
  double,
  text,
  jsonb,
  bool,
  nullable,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'advancedRules',
    {
      id: id(),
      viewId: getForeignUuid(sql.models.view, 'view_id'),
      name: name(),
      active: bool(),
      objectType: text('object_type'),
      detectionType: text('detection_type'),
      detectionPeriod: nullable(smallInt('detection_period')),
      detectionMin: nullable(smallInt('detection_min')),
      detectionMax: nullable(smallInt('detection_max')),
      detectionSimilarityThreshold: nullable(double('detection_similarity_threshold')),
      zones: nullable(jsonb('zones')),
      meta: nullable(jsonb('meta')),
      createdBy: getForeignUuid(sql.models.user, 'created_by'),
      createdAt: createdAt(),
      updatedBy: nullable(getForeignUuid(sql.models.user, 'updated_by')),
      updatedAt: nullable(updatedAt()),
      integratorId: nullable(name('integrator_id')),
    },
    {
      tableName: 'rules',
      schema: 'advanced_rules',
    },
  )
}

export default create
