import { QueryTypes } from 'sequelize'

import { initDB } from '../db/index.js'

const FIND_COMPANY_QUERY = `
  SELECT c.id AS id 
    FROM public.companies c
    INNER JOIN public.users u
      ON u.company_id = c.id
    INNER JOIN public.projects p
      ON p.company_id = c.id  
  WHERE u.id = :userId
    AND p.id = :projectId
    AND p.deleted_at IS NULL
    AND u.deleted_at IS NULL
    AND c.deleted_at IS NULL
  LIMIT 1
`

/**
 * @param {string} userId
 * @param {string} projectId
 *
 * @returns {Promise<boolean>}
 */
export default async (userId, projectId) => {
  const sql = await initDB()

  const rows = await sql.query(FIND_COMPANY_QUERY, {
    replacements: {
      userId,
      projectId,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })

  return rows && rows.length > 0
}
