import {
  idChar,
  name,
  createdAt,
  updatedAt,
  chain,
  unique,
  req,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'permission',
    {
      id: idChar(),
      name: chain(unique, req, name()),
      createdAt: createdAt(),
      updatedAt: updatedAt(),
    },
  )
}

export default create
