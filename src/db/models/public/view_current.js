import {
  id,
  name,
  getForeignUuid,
  jsonb,
  email,
  bool,
  createdAt,
  updatedAt,
  req,
  nullable,
  defaultValue,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'viewCurrent',
    {
      id: id(),
      userId: getForeignUuid(sql.models.user, 'user_id'),
      siteId: getForeignUuid(sql.models.site, 'site_id'),
      integratorId: nullable(name('integrator_id')),
      companyId: nullable(getForeignUuid(sql.models.company, 'company_id')),
      tokenId: nullable(getForeignUuid(sql.models.token, 'token_id')),
      name: req(name()),
      output: email(),
      isSnapshot: bool('is_snapshot'),
      isThermal: bool('is_thermal'),
      isTampering: bool('is_tampering'),
      mask: jsonb(),
      meta: jsonb() /** { recording_view_id: <uuid>, mask_selected: boolean} */,
      status: defaultValue({ active: true })(jsonb()),
      tamperingConfig: jsonb('tampering_config'),
      createdAt: createdAt(),
      updatedAt: updatedAt(),
    },
    {
      underscoredAll: true,
      tableName: 'view_currents',
      schema: 'public',
    },
  )
}

export default create
