import {
  id,
  name,
  jsonb,
  createdAt,
  updatedAt,
  deletedAt,
  req,
  defaultValue,
  uuid,
  nullable,
  timezone,
  bool,
  integer,
  text,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'company',
    {
      id: id(),
      name: req(name()),
      createdAt: createdAt(),
      updatedAt: updatedAt(),
      deletedAt: deletedAt(),
      defaultSiteTimezone: timezone('default_sites_timezone'),
      createdBy: nullable(uuid('created_by')),
      tamperingConfig: nullable(jsonb('tampering_config')),
      isTamperingUnlocked: defaultValue(false)(bool('is_tampering_unlocked')),
      isForensicUnlocked: defaultValue(false)(bool('is_forensic_unlocked')),
      isAdvancedForensicUnlocked: defaultValue(false)(bool('is_advanced_forensic_unlocked')),
      // product and companyType are also foreign keys
      product: nullable(text()),
      companyType: nullable(text('company_type')),
      alarmRetentionDays: integer('alarm_retention_days'),
      integratorId: nullable(name('integrator_id')),
    },
    {
      paranoid: true,
    },
  )
}

export default create
