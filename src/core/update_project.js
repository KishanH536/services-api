import {
  initDB,
} from '../db/index.js'

/**
 * @param {string} companyId
 * @param {string} projectId
 * @param {Object<{ projectName: string }>} values
 *
 * @returns {Promise<{ id: string, integratorId: string, name: string }>}
 */
export default async (companyId, projectId, { projectName }) => {
  const sql = await initDB()

  const project = await sql.models.project.findOne({
    where: {
      companyId,
      id: projectId,
    },
  })

  if (project) {
    await project.update({ name: projectName })

    return {
      id: project.id,
      integratorId: project.integratorId,
      name: project.name,
    }
  }

  return null
}
