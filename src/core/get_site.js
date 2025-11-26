import { QueryTypes } from 'sequelize'

import { initDB } from '../db/index.js'

const SITE_BY_INTEGRATOR_ID_QUERY = `
  SELECT DISTINCT(sa.id) AS "calipsaSiteId",
                sc.created_at "createdAt",
                sc.name "name",
                sc.integrator_id "integratorId",
                sc.timezone "timeZone",
                sc.project_id "projectId"
  FROM public.companies c
  INNER JOIN public.users u
    ON u.company_id = c.id
  INNER JOIN public.projects p
    ON p.company_id = c.id
  INNER JOIN public.sites_all sa
    ON sa.project_id = p.id
  INNER JOIN public.site_currents sc
    ON sa.id = sc.id
  WHERE u.id = :userId
    AND sc.integrator_id = :siteIntegratorId
    AND p.integrator_id = :clientIntegratorId
    AND sa.deleted_at IS NULL
    AND p.deleted_at IS NULL
    AND u.deleted_at IS NULL
    AND c.deleted_at IS NULL
   ORDER BY sc.created_at DESC
  LIMIT 1
`

const SITE_BY_ID_QUERY = `
  SELECT DISTINCT(sa.id) AS "calipsaSiteId",
                sc.created_at "createdAt",
                sc.name "name",
                sc.timezone "timeZone",
                sc.project_id "projectId"
  FROM public.companies c
  INNER JOIN public.users u
    ON u.company_id = c.id
  INNER JOIN public.projects p
    ON p.company_id = c.id
  INNER JOIN public.sites_all sa
    ON sa.project_id = p.id
  INNER JOIN public.site_currents sc
    ON sa.id = sc.id
  WHERE u.id = :userId
    AND sc.id = :siteId
    AND sa.deleted_at IS NULL
    AND u.deleted_at IS NULL
  ORDER BY sc.created_at DESC
  LIMIT 1
`

const SITE_BY_ID_FOR_SHARED_SITE_QUERY = `
  SELECT DISTINCT(sa.id) AS "calipsaSiteId",
                sc.created_at "createdAt",
                sc.name "name",
                sc.timezone "timeZone",
                sc.project_id "projectId",
                sc.user_id "userId"
  FROM public.companies c
    INNER JOIN public.users u
      ON u.company_id = c.id
    INNER JOIN projects p
      ON p.company_id = c.id
    INNER JOIN sites_all sa
      ON sa.project_id = p.id
    INNER JOIN public.site_currents sc
      ON sc.id = sa.id
  WHERE sc.id = :siteId
    AND sa.deleted_at IS NULL
    AND u.deleted_at IS NULL
  ORDER BY sc.created_at DESC
  LIMIT 1
`

const getSite = async (query, replacements) => {
  const sql = await initDB()

  const rows = await sql.query(query, {
    replacements,
    type: QueryTypes.SELECT,
    logging: false,
  })

  if (rows && rows.length) {
    return rows[0]
  }

  return null
}

/**
 *
 * @param {*} userId
 * @param {*} clientIntegratorId
 * @param {*} siteName
 *
 * @returns {Promise<{
 *  calipsaSiteId: string,
 *  integratorId: string,
 *  name: string,
 *  timeZone: string,
 *  projectId: string }>}
 */
export const getSiteByIntegratorId = async (userId, clientIntegratorId, siteIntegratorId) =>
  await getSite(SITE_BY_INTEGRATOR_ID_QUERY, {
    userId,
    clientIntegratorId,
    siteIntegratorId,
  })

/**
 *
 * @param {*} userId
 * @param {*} siteId
 *
 * @returns {Promise<{
*  calipsaSiteId: string,
*  name: string,
*  timeZone: string,
*  projectId: string }>}
*/
export const getSiteById = async (userId, siteId) =>
  await getSite(SITE_BY_ID_QUERY, {
    userId,
    siteId,
  })

export const getSiteByIdForSharedSite = async (siteId) =>
  await getSite(SITE_BY_ID_FOR_SHARED_SITE_QUERY, { siteId })
