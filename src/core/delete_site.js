import { initDB } from '../db/index.js'

import {
  getSiteById,
  getSiteByIntegratorId,
} from './get_site.js'
import { cleanAndDeleteViews } from './clean_and_delete_views.js'

const softDeleteSite = async (siteId) => {
  const sql = await initDB()

  const result = await sql.transaction(async (t) => {
    const views = await sql.models.viewCurrent.findAll(
      {
        where: {
          siteId,
        },
        raw: true,
      },
    )
    await cleanAndDeleteViews(sql, t, views)

    return await sql.models.site.update(
      {
        deletedAt: sql.literal('CURRENT_TIMESTAMP'),
      },
      {
        where: {
          id: siteId,
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

  return affectedRows[0]
}

export const softDeleteSiteByIntegratorId = async (
  userId,
  clientIntegratorId,
  siteIntegratorId,
) => {
  const site = await getSiteByIntegratorId(userId, clientIntegratorId, siteIntegratorId)

  if (!site) {
    return null
  }

  return await softDeleteSite(site.calipsaSiteId)
}

export const softDeleteSiteById = async (userId, siteId) => {
  const site = await getSiteById(userId, siteId)

  if (!site) {
    return null
  }

  return await softDeleteSite(siteId)
}
