import {
  intIdInc,
  req,
  name,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'capability',
    {
      id: intIdInc(),
      name: req(name()),
    },
    {
      paranoid: true,
    },
  )
}

export default create
