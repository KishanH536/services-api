import { QueryTypes } from 'sequelize'

import { initDB } from '../db/index.js'

const PROJECTS_BY_COMPANY_ID_QUERY = `
  SELECT p.id AS "id",
         p.name "name",
         p.integrator_id "integratorId"
  FROM public.companies c
    INNER JOIN public.users u
      ON u.company_id = c.id
    INNER JOIN projects p
      ON p.company_id = c.id
  WHERE u.id = :userId
    AND c.id = :companyId
    AND p.deleted_at IS NULL
    AND u.deleted_at IS NULL
    AND c.deleted_at IS NULL
`

/**
 *
 * @param {*} userId
 * @param {*} companyId
 *
 * @returns {Promise<Array<{
*   id: string,
*   name: string,
*   integratorId: string
*  }>>}
*/
export default async (userId, companyId) => {
  const sql = await initDB()

  return await sql.query(PROJECTS_BY_COMPANY_ID_QUERY, {
    replacements: {
      userId,
      companyId,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })
}
