import { QueryTypes } from 'sequelize'

import { initDB } from '../db/index.js'

// NOTE: These queries now sort alphabetically based on name, and this may
//       require an index on "name" if the queries are slow, and if we
//       introduce pagination for these lists.

const SITES_BY_CLIENT_INTEGRATOR_ID_QUERY = `
  SELECT DISTINCT(sa.id) AS "calipsaSiteId",
                sc.created_at "createdAt",
                sc.name "name",
                sc.integrator_id "integratorId",
                sc.timezone "timeZone",
                sc.project_id "projectId"
  FROM public.companies c
    INNER JOIN public.users u
      ON c.id = u.company_id
    INNER JOIN public.projects p
      ON c.id = p.company_id
    INNER JOIN public.sites_all sa
      ON p.id = sa.project_id
    INNER JOIN public.site_currents sc
      ON sa.id = sc.id
  WHERE u.id = :userId
    AND p.integrator_id = :clientIntegratorId
    AND sa.deleted_at IS NULL
    AND p.deleted_at IS NULL
    AND u.deleted_at IS NULL
    AND c.deleted_at IS NULL
  ORDER BY sc.name ASC
`

const SITES_BY_CLIENT_ID_QUERY = `
  SELECT sa.id AS "calipsaSiteId",
                sc.created_at "createdAt",
                sc.name "name",
                sc.integrator_id "integratorId",
                sc.timezone "timeZone",
                sc.project_id "projectId",
                c.id "companyId"
  FROM public.companies c
    INNER JOIN public.users u
      ON c.id = u.company_id
    INNER JOIN public.projects p
      ON c.id = p.company_id
    INNER JOIN public.sites_all sa
      ON p.id = sa.project_id
    INNER JOIN public.site_currents sc
      ON sa.id = sc.id
  WHERE u.id = :userId
    AND sc.project_id = :clientId
    AND sa.deleted_at IS NULL
    AND p.deleted_at IS NULL
    AND c.deleted_at IS NULL
    AND u.deleted_at IS NULL
  ORDER BY sc.name ASC
`

const getSites = async (query, replacements) => {
  const sql = await initDB()

  return await sql.query(query, {
    replacements,
    type: QueryTypes.SELECT,
    logging: false,
  })
}

/**
 *
 * @param {*} userId
 * @param {*} clientIntegratorId
 *
 * @returns {Promise<Array<{
 *  calipsaSiteId: string,
 *  name: string,
 *  integratorId: string,
 *  timeZone: string,
 *  projectId: string }>>}
 */
export const getSitesByClientIntegratorId = async (userId, clientIntegratorId) =>
  await getSites(SITES_BY_CLIENT_INTEGRATOR_ID_QUERY, {
    userId,
    clientIntegratorId,
  })

/**
 *
 * @param {*} userId
 * @param {*} clientId
 *
 * @returns {Promise<Array<{
*  calipsaSiteId: string,
*  name: string,
*  timeZone: string,
*  integratorId: string,
*  projectId: string,
*  companyId: string }>>}
*/
export const getSitesByClientId = async (userId, clientId) =>
  await getSites(SITES_BY_CLIENT_ID_QUERY, {
    userId,
    clientId,
  })
