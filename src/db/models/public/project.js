import {
  id,
  name,
  createdAt,
  updatedAt,
  deletedAt,
  req,
  nullable,
  uuid,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'project',
    {
      id: id(),
      // Actually a foreign key.
      companyId: req(uuid('company_id')),
      name: req(name()),
      integratorId: nullable(name('integrator_id')),
      createdAt: createdAt(),
      updatedAt: updatedAt(),
      deletedAt: deletedAt(),
    },
    {
      paranoid: true,
      schema: 'public',
    },
  )
}

export default create
