import {
  id,
  getForeignUuid,
  name,
  nullable,
  createdAt,
  deletedAt,
} from '../../columns.js'

/*
 * Sequelize doesn't go along with using the same object for describing
 * the type of multiple fields. Don't understand.
 */
function create(sql) {
  sql.define(
    'view',
    {
      id: id(),
      siteId: getForeignUuid(sql.models.site, 'site_id'),
      userId: getForeignUuid(sql.models.user, 'user_id'),
      integratorId: nullable(name('integrator_id')),
      createdAt: createdAt(),
      deletedAt: deletedAt(),
    },
    {
      paranoid: true,
      updatedAt: false,
      schema: 'public',
    },
  )
}

export default create
