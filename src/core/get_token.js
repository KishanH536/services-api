import {
  initDB,
} from '../db/index.js'

const SHARED_SITE_TOKEN_QUERY = `
  SELECT t.id,
         t.site_id "siteId",
         t.user_id "userId",
         t."maskedToken",
         t.created_at "createdAt",
         t."updatedAt",
         t.type,
         t.note
  FROM public.tokens t
  INNER JOIN public.user_sites_permissions usp
    ON usp.site_id = t.site_id
  WHERE t.id = :id
    AND usp.user_id = :userId
    AND usp.permission_id = 'SHARED_SITE_USER'
    AND usp.deleted_at IS NULL
    AND t.deleted_at IS NULL
`

/**
 * @param {string} id
 * @param {string} userId
 *
 * @returns {Promise<{ id: string }>}
 */
export const getTokenById = async (id, userId) => {
  const sql = await initDB()

  return await sql.models.token.findOne({
    where: {
      userId,
      id,
      deletedAt: null,
    },
  })
}

/**
 * @param {string} id
 * @param {string} userId
 *
 * @returns {Promise<{ id: string, note: string }>}
 */
export const getSharedSiteTokenById = async (id, userId) => {
  const sql = await initDB()

  return await sql.query(SHARED_SITE_TOKEN_QUERY, {
    replacements: {
      id,
      userId,
    },
    logging: false,
  })
}
