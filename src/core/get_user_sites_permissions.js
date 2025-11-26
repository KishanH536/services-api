import {
  initDB,
} from '../db/index.js'

/**
 * @param {string} userId
 * @param {string} siteId
 *
 * @returns {Promise<{ id: string, name: string }>}
 */
export default async (userId, siteId) => {
  const sql = await initDB()

  return await sql.models.userSitePermission.findOne({
    where: {
      userId,
      siteId,
    },
    raw: true,
    logging: false,
  })
}
