import { QueryTypes } from 'sequelize'

import { initDB } from '../db/index.js'

const FIND_COMPANY_QUERY = `
  SELECT c.id AS id FROM public.companies c
    INNER JOIN public.users u
      ON u.company_id = c.id
    INNER JOIN projects p
      ON p.company_id = c.id
    INNER JOIN sites_all sa
      ON sa.project_id = p.id  
  WHERE u.id = :userId
    AND sa.id = :siteId
    AND sa.deleted_at IS NULL
    AND p.deleted_at IS NULL
    AND u.deleted_at IS NULL
    AND c.deleted_at IS NULL
  LIMIT 1
`

/**
 * @param {string} userId
 * @param {string} siteId
 *
 * @returns {Promise<boolean>}
 */
export default async (userId, siteId) => {
  const sql = await initDB()

  const rows = await sql.query(FIND_COMPANY_QUERY, {
    replacements: {
      userId,
      siteId,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })

  return rows && rows.length > 0
}
