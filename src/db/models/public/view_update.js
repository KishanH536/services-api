import {
  intIdInc,
  name,
  getForeignUuid,
  jsonb,
  email,
  bool,
  createdAt,
  req,
  nullable,
} from '../../columns.js'

/*
 * Sequelize doesn't go along with using the same object for describing
 * the type of multiple fields. Don't understand.
 */
function create(sql) {
  sql.define(
    'viewUpdate',
    {
      id: intIdInc(),
      viewId: getForeignUuid(sql.models.view, 'view_id'),
      userId: getForeignUuid(sql.models.user, 'user_id'),
      name: req(name()),
      output: email(),
      status: jsonb(),
      isSnapshot: bool('is_snapshot'),
      mask: jsonb(),
      meta: nullable(jsonb()),
      createdAt: createdAt(),
      isThermal: bool('is_thermal'),
      isTampering: bool('is_tampering'),
      tamperingConfig: jsonb('tampering_config'),
    },
    {
      underscoredAll: true,
      updatedAt: false,
      tableName: 'view_updates',
      schema: 'public',
      indexes: [
        {
          fields: [
            'view_id',
            'created_at',
          ],
        },
      ],
    },
  )
}

export default create
