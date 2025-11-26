import {
  id,
  email,
  name,
  password,
  createdAt,
  updatedAt,
  deletedAt,
  req,
  chain,
  dateField,
  nullable,
  uuid,
  text,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'user',
    {
      id: id(),
      // Actually a foreign key.
      companyId: req(uuid('company_id')),
      email: chain(req, email('email')),
      password: req(password()),
      name: name(),
      createdAt: createdAt(),
      updatedAt: updatedAt(),
      deletedAt: deletedAt(),
      passwordUpdatedAt: dateField('password_updated_at'),
      // createdBy: nullable(getForeignUuid(sql.models.user, 'created_by')),
      createdBy: nullable(uuid('created_by')),
      product: nullable(text()),
    },
    {
      paranoid: true,
      schema: 'public',
    },
  )
}

export default create
