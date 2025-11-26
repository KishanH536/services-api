import { QueryTypes } from 'sequelize'

import { services } from '../services/index.js'

const FIND_ADMIN_USER_ID_QUERY = `
  SELECT ucp.user_id "user_id"
  FROM public.user_companies_permissions ucp
  WHERE ucp.company_id = :companyId
    AND ucp.deleted_at IS NULL
    AND ucp.permission_id = 'ADMIN_USER'
  LIMIT 1
`

/**
 * @param {String} companyId
 *
 * @returns {Promise<{
*    id: string,
*  }>}
*/
export default async (companyId) => {
  const { DB: sql } = services
  const rows = await sql.query(FIND_ADMIN_USER_ID_QUERY, {
    replacements: {
      companyId,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })

  if (!rows?.length) {
    return null
  }
  const {
    user_id: userId,
  } = rows[0]

  return userId
}
