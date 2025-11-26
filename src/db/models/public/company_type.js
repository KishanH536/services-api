import {
  idText,
  text,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'company_type',
    {
      name: idText(),
      description: text(),
    },
    {
      paranoid: true,
      schema: 'public',
    },
  )
}

export default create
