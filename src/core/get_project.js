import {
  initDB,
} from '../db/index.js'

/**
 * @param {string} companyId
 * @param {string} projectId
 *
 * @returns {Promise<{ id: string, name: string }>}
 */
export default async (companyId, projectId) => {
  const sql = await initDB()

  return await sql.models.project.findOne({
    where: {
      companyId,
      id: projectId,
    },
  })
}
