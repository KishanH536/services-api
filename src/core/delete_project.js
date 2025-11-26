import { initDB } from '../db/index.js'

import { getSitesByClientId } from './get_sites.js'
import getProject from './get_project.js'
import getProjectByIntegratorId from './find_project_by_integrator_id.js'
import { cleanAndDeleteViews } from './clean_and_delete_views.js'

const softDeleteClient = async (userId, client) => {
  if (!client) {
    return null
  }

  const clientId = client.id
  const sql = await initDB()

  const sites = await getSitesByClientId(userId, clientId)
  const siteIds = sites.map(site => site.calipsaSiteId)

  const result = await sql.transaction(async (t) => {
    const views = await sql.models.viewCurrent.findAll(
      {
        where: {
          siteId: siteIds, // Sequalize infers as "where: { siteId: { [Op.in]: siteIds } }"
        },
        raw: true,
      },
    )

    await cleanAndDeleteViews(sql, t, views)

    // Delete all sites for the client
    await sql.models.site.update(
      {
        deletedAt: sql.literal('CURRENT_TIMESTAMP'),
      },
      {
        where: {
          projectId: clientId,
          deletedAt: null,
        },
        transaction: t,
      },
    )

    // Delete the client
    return await sql.models.project.update(
      {
        deletedAt: sql.literal('CURRENT_TIMESTAMP'),
      },
      {
        where: {
          id: clientId,
        },
        returning: true,
        transaction: t,
      },
    )
  })

  const [affectedCount, affectedRows] = result

  if (!affectedCount) {
    return null
  }

  return {
    id: affectedRows[0].id,
    deletedAt: affectedRows[0].deletedAt,
  }
}

/**
 * @param {string} userId
 * @param {string} companyId
 * @param {string} clientIntegratorId
 *
 * @returns {Promise<{ id: string, deletedAt: Date }>}
 */
export const softDeleteClientByIntegratorId = async (userId, companyId, clientIntegratorId) => {
  const client = await getProjectByIntegratorId(companyId, clientIntegratorId)
  return await softDeleteClient(userId, client)
}

/**
 * @param {string} userId
 * @param {string} companyId
 * @param {string} clientId
 *
 * @returns {Promise<{ id: string, deletedAt: Date }>}
 */
export const softDeleteClientById = async (userId, companyId, clientId) => {
  const client = await getProject(companyId, clientId)
  return await softDeleteClient(userId, client)
}
