import { initDB } from '../db/index.js'

/**
 * @param {string} companyId
 * @param {string} integratorId
 * @param {string} projectName
 *
 * @returns {Promise<{ id: string, integratorId: string, name: string, created: boolean }>}
 */
export const findOrCreateProject = async (companyId, integratorId, projectName = null) => {
  const sql = await initDB()

  const [project, created] = await sql.models.project.findOrCreate({
    where: {
      companyId,
      integratorId,
    },
    defaults: {
      name: projectName || integratorId,
    },
  })

  return {
    id: project.id,
    integratorId: project.integratorId,
    name: project.name,
    created,
  }
}

/**
 * @param {string} companyId
 * @param {string} integratorId
* @param {string} projectName
 *
 * @returns {Promise<{ id: string, integratorId, name: string, created: boolean }>}
 */
export const createProject = async (companyId, integratorId, projectName) => {
  const sql = await initDB()

  const project = await sql.models.project.create({
    companyId,
    integratorId,
    name: projectName,
  })

  return {
    id: project.id,
    integratorId: project.integratorId,
    name: project.name,
    created: true,
  }
}
