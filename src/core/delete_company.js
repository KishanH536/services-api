import { services } from '../services/index.js'

import { cleanAndDeleteViews } from './clean_and_delete_views.js'

const softDeleteViews = async (siteIds, transaction) => {
  if (!siteIds || !siteIds.length) {
    return
  }

  const { DB: sql } = services
  const views = await sql.models.viewCurrent.findAll(
    {
      where: {
        siteId: siteIds, // Sequelize infers as "where: { siteId: { [Op.in]: siteIds } }"
      },
      raw: true,
    },
  )

  await cleanAndDeleteViews(sql, transaction, views)
}

const softDeleteSites = async (clientIds, transaction) => {
  if (!clientIds || !clientIds.length) {
    return
  }

  const { DB: sql } = services
  const [affectedSiteCount, affectedSiteRows] = await sql.models.site.update(
    {
      deletedAt: sql.literal('CURRENT_TIMESTAMP'),
    },
    {
      where: {
        projectId: clientIds,
        deletedAt: null,
      },
      returning: true,
      transaction,
    },
  )

  return affectedSiteCount && affectedSiteRows.map(site => site.id)
}

const softDeleteClients = async (companyId, transaction) => {
  const { DB: sql } = services
  const [affectedClientCount, affectedClientRows] = await sql.models.project.update(
    {
      deletedAt: sql.literal('CURRENT_TIMESTAMP'),
    },
    {
      where: {
        companyId,
        deletedAt: null,
      },
      returning: true,
      transaction,
    },
  )

  return affectedClientCount && affectedClientRows.map(client => client.id)
}

const cascadeDeleteResources = async (companyId, transaction) => {
  // Delete all clients, by company ID
  const clientIds = await softDeleteClients(companyId, transaction)

  // Delete all sites, by client IDs
  const siteIds = await softDeleteSites(clientIds, transaction)

  // Delete all views, by sites IDs
  await softDeleteViews(siteIds, transaction)
}

const deleteCompanyTransaction = async (companyId, transaction) => {
  await cascadeDeleteResources(companyId, transaction)

  const { DB: sql } = services
  const [affectedCount, affectedRows] = await sql.models.company.update(
    {
      deletedAt: sql.literal('CURRENT_TIMESTAMP'),
    },
    {
      where: {
        id: companyId,
        deletedAt: null,
      },
      returning: true,
      transaction,
    },
  )

  if (!affectedCount) {
    return null
  }

  return {
    id: affectedRows[0].id,
    deletedAt: affectedRows[0].deletedAt,
  }
}

/**
 * @param {string} companyId
 * @param {transaction} transaction
 *
 * @returns {Promise<{ id: string, deletedAt: Date }>}
 */
export const softDeleteCompanyById = async (companyId, transaction = null) => {
  if (!companyId) {
    return null
  }

  if (transaction) {
    return await deleteCompanyTransaction(companyId, transaction)
  }

  const { DB: sql } = services
  return await sql.transaction(async (t) =>
    await deleteCompanyTransaction(companyId, t))
}
