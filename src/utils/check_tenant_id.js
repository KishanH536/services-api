import { QueryTypes } from 'sequelize'

import { services } from '../services/index.js'

// This checks that the user that created the tenant is associated with the
// company making the request
const CHECK_CHILD_COMPANY_QUERY = `
  SELECT u.id FROM users u 
  JOIN companies c ON u.id = c.created_by 
  WHERE c.id = :tenantId
  and u.company_id = :companyId
  LIMIT 1
`

/**
 * @param {String} tenantId
 * @param {String} companyId
 *
 * @returns {Promise{Boolean}}
*/
export default async (tenantId, companyId) => {
  const { DB: sql } = services
  const rows = await sql.query(CHECK_CHILD_COMPANY_QUERY, {
    replacements: {
      companyId,
      tenantId,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })

  return rows?.length !== 0
}
