import { QueryTypes } from 'sequelize'

import { services } from '../services/index.js'

const GET_LAST_DETECTION = `
  SELECT *
  FROM tampering
  WHERE
    view_id = :viewId
    AND created_at >= :backLimit
    AND status <> 'failed'
  LIMIT 1
`

export const getTamperingDetections = async (viewId, backLimit) => {
  const { DB: sql } = services
  return sql.query(
    GET_LAST_DETECTION,
    {
      type: QueryTypes.SELECT,
      replacements: {
        viewId,
        backLimit,
      },
    },
  )
}
