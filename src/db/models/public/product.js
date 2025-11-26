import {
  idText,
  text,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'product',
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
