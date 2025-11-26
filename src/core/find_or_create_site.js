import { QueryTypes } from 'sequelize'

import { initDB } from '../db/index.js'

const FIND_SITE_QUERY = `
  SELECT sa.id AS id,
        sc.name "name",
        sc.timezone "timeZone"
  FROM public.sites_all sa
    INNER JOIN public.site_currents sc
      ON sc.id = sa.id
    INNER JOIN public.projects p
      ON sa.project_id = p.id
    INNER JOIN public.companies c
      ON p.company_id = c.id
    INNER JOIN public.users u
     ON u.company_id = c.id
  WHERE c.id = :companyId
    AND p.id = :projectId
    AND u.id = :userId
    AND sa.integrator_id = :integratorId
    AND c.deleted_at IS NULL
    AND p.deleted_at IS NULL
    AND u.deleted_at IS NULL
    AND sa.deleted_at IS NULL
`

const createSiteDb = async (sql, projectId, userId, integratorId, siteName, timezone) => {
  const name = siteName || integratorId

  const result = await sql.transaction(async (t) => {
    const publicSiteAll = await sql.models.site.create(
      {
        projectId,
        userId,
        integratorId,
      },
      {
        logging: false,
        transaction: t,
      },
    )

    const updateResult = await sql.models.siteCurrent.update(
      {
        projectId,
        userId,
        name,
        type: 'api',
        fields: {},
        timezone,
      },
      {
        where: {
          id: publicSiteAll.id,
        },
        returning: true,
        raw: true,
        transaction: t,
      },
    )
    // If we affected exactly 1 row, we were successful
    if (updateResult && updateResult[0] === 1) {
      return publicSiteAll
    }
    return null
  })

  return {
    id: result.id,
    integratorId: result.integratorId,
    name,
    timeZone: timezone,
    created: true,
  }
}

/**
 * @param {string} projectId
 * @param {string} userId
 * @param {string} integratorId
 * @param {string} siteName
 * @param {string} timezone
 *
 * @returns {Promise<{ id: string, integratorId: string, name: string, created: boolean }>}
 */
export const createSite = async (
  projectId,
  userId,
  integratorId,
  siteName = null,
  timezone = null,
) => {
  const sql = await initDB()

  return await createSiteDb(sql, projectId, userId, integratorId, siteName, timezone)
}

/**
 * @param {string} companyId
 * @param {string} projectId
 * @param {string} userId
 * @param {string} integratorId
 * @param {string} siteName
 * @param {string} timezone
 *
 * @returns {Promise<{ id: string, integratorId: string, name: string, created: boolean }>}
 */
export const findOrCreateSite = async (
  companyId,
  projectId,
  userId,
  integratorId,
  siteName = null,
  timezone = null,
) => {
  const sql = await initDB()

  const rows = await sql.query(FIND_SITE_QUERY, {
    replacements: {
      companyId,
      projectId,
      userId,
      integratorId,
    },
    type: QueryTypes.SELECT,
    logging: true,
  })

  // No need to create a new site.
  if (rows && rows.length > 0) {
    return {
      id: rows[0].id,
      integratorId,
      name: rows[0].name,
      timeZone: rows[0].timeZone,
      created: false,
    }
  }

  return await createSiteDb(sql, projectId, userId, integratorId, siteName, timezone)
}
