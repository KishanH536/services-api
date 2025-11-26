import {
  createdAt,
  updatedAt,
  deletedAt,
  dateField,
  id,
  bool,
  text,
  uuid,
  getForeignUuid,
  tamperingStatus,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'tampering',
    {
      id: id(),
      viewId: getForeignUuid(sql.models.view, 'view_id'),
      siteId: getForeignUuid(sql.models.site, 'site_id'),
      projectId: getForeignUuid(sql.models.project, 'project_id'),
      companyId: getForeignUuid(sql.models.company, 'company_id'),
      createdAt: createdAt(),
      updatedAt: updatedAt(),
      deletedAt: deletedAt(),
      snapshotId: uuid('snapshot_id'),
      snapshotTime: dateField('snapshot_time'),
      status: tamperingStatus(),
      comment: text(),
      aiResult: bool('ai_result'),
      dismissed: bool(),
      groundTruth: bool('ground_truth'),
      processError: text('process_error'),
      referenceId: text('reference_id'),
      referenceUpdatedAt: dateField('reference_updated_at'),
      isDayReference: bool('is_day_reference'),
    },
    {
      tableName: 'tampering',
      paranoid: true,
      schema: 'public',
    },
  )
}

export default create
