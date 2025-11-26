import {
  id,
  createdAt,
  token,
  deletedAt,
  req,
  text,
  getForeignUuid,
  name,
  uuid,
  nullable,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'token',
    {
      id: id(),
      userId: getForeignUuid(sql.models.user, 'user_id'),
      token: req(token()),
      maskedToken: req(token()),
      type: req(name()), // make an enum
      note: text(),
      siteId: nullable(uuid('site_id')), // not required, so not using getForeignUuid
      createdAt: createdAt(),
      deletedAt: deletedAt(),
    },
    {
      tableName: 'tokens',
      paranoid: true,
    },
  )
}

export default create
