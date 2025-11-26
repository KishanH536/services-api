import { QueryTypes } from 'sequelize'

import { initDB } from '../db/index.js'

const LIST_COMPANIES_QUERY = `
  SELECT  c.id,
          c.name
    FROM public.companies c
    WHERE c.id IN (:companyIds)
    ORDER BY c.name ASC;
`

/**
 * @param {Array<Object>} companyIds
 *
 * @returns {Promise<Array<companies>>}
 */
export default async (companyIds) => {
  if (companyIds.length === 0) {
    return []
  }

  const sql = await initDB()

  const rows = await sql.query(LIST_COMPANIES_QUERY, {
    replacements: {
      companyIds,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })

  return rows
}
