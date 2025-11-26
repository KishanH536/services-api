import { QueryTypes } from 'sequelize'

import { initDB } from '../db/index.js'

const SHARED_SITE_QUERY = `
  SELECT sa.id,
         sa.user_id "userId",
         c.id "companyId"
  FROM public.sites_all sa
  INNER JOIN public.projects p
    ON sa.project_id = p.id
  INNER JOIN public.companies c
      ON p.company_id = c.id
  INNER JOIN public.user_sites_permissions usp
    ON sa.id = usp.site_id
  WHERE sa.id = :siteId
    AND usp.user_id = :shareeUserId
    AND usp.permission_id = 'SHARED_SITE_USER'
    AND sa.deleted_at IS NULL
    AND p.deleted_at IS NULL
    AND c.deleted_at IS NULL
    AND usp.deleted_at IS NULL
`

/**
 *
 * @param {string} shareeUserId
 * @param {string} siteId
 *
 * @returns {Promise<Array<{
*   id: string,
*   userId: string,
*   companyId: string
*  }>|null>}
*/
const getSharedSite = async (shareeUserId, siteId) => {
  const sql = await initDB()

  const rows = await sql.query(SHARED_SITE_QUERY, {
    replacements: {
      shareeUserId,
      siteId,
    },
    type: QueryTypes.SELECT,
    raw: true,
    logging: false,
  })

  if (rows && rows.length === 0) {
    return null
  }
  return rows[0]
}

export default getSharedSite
