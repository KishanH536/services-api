import { initDB } from '../db/index.js'

/**
 * @param {string} userId
 * @param {string} siteId
 * @param {string} siteName
 * @param {string} timeZone
 *
 * @returns {Promise<{id: string, name: string, timeZone: string}>}
 */
export default async (userId, siteId, siteName, timeZone = null) => {
  const sql = await initDB()

  const updateResult = await sql.models.siteCurrent.update(
    {
      userId,
      name: siteName,
      timezone: timeZone,
    },
    {
      where: {
        id: siteId,
      },
      paranoid: false,
      returning: false,
      logging: false,
    },
  )

  // If we affected exactly 1 row, we were successful
  if (updateResult && updateResult[0] === 1) {
    return {
      id: siteId,
      name: siteName,
      timeZone,
    }
  }
  return null
}
