import {
  initDB,
} from '../db/index.js'

/**
 * @param {string} companyId
 * @param {string} projectName
 *
 * @returns {Promise<{ id: string, name: string }>}
 */
export default async (companyId, integratorId) => {
  const sql = await initDB()

  return await sql.models.project.findOne({
    where: {
      companyId,
      integratorId,
    },
  })
}
