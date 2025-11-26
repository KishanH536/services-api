import { QueryTypes } from 'sequelize'

import { services } from '../services/index.js'

const FIND_COMPANY_QUERY = `
  SELECT c.id AS id,
          c.name AS name,
          c.product AS product,
          c.created_by AS "createdBy",
          c.alarm_retention_days AS "alarmRetentionDays",
          c.default_sites_timezone AS "defaultSitesTimezone",
          c.tampering_config AS "tamperingConfig",
          cu.company_id AS "createdByCompanyId",
          cc.name AS "createdByCompanyName",
          c.integrator_id AS "integratorId"
  FROM public.companies c
    INNER JOIN public.users u
      ON u.company_id = c.id
    LEFT JOIN public.users cu
      ON c.created_by = cu.id
    LEFT JOIN public.companies cc
      ON cc.id = cu.company_id
  WHERE u.id = :userId
    AND u.deleted_at IS NULL
    AND c.deleted_at IS NULL
  LIMIT 1
`

const FIND_COMPANY_BY_ID_QUERY = `
  SELECT c.id AS id,
          c.name AS name,
          c.product AS product,
          c.created_by AS "createdBy",
          c.alarm_retention_days AS "alarmRetentionDays",
          c.created_by AS "createdBy",
          c.integrator_id AS "integratorId"
  FROM public.companies c
  WHERE c.id = :companyId
    AND c.deleted_at IS NULL
  LIMIT 1
`

const FIND_COMPANY_BY_INTEGRATOR_ID_QUERY = `
  SELECT c.id AS id,
          c.name AS name,
          c.product AS product,
          c.created_by AS "createdBy",
          c.alarm_retention_days AS "alarmRetentionDays",
          c.created_by AS "createdBy",
          c.integrator_id AS "integratorId"
  FROM public.companies c
  WHERE c.integrator_id = :integratorId
    AND c.created_by = :integrationPartnerId
    AND c.deleted_at IS NULL
  LIMIT 1
`

/**
 * @param {string} userId
 *
 * @returns {Promise<{ id: string, name: string, product: string}}
 */
export const getCompanyByUserId = async (userId) => {
  const { DB: sql } = services
  const rows = await sql.query(FIND_COMPANY_QUERY, {
    replacements: {
      userId,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })

  return rows && rows.length > 0 ? rows[0] : null
}

/**
 *
 * @param {string} companyId
 * @returns {Promise<{
 *   id: string,
 *   name: string,
 *   product: string,
 *   createdBy: string
 * }}
 */
export const getCompanyById = async (companyId) => {
  const { DB: sql } = services
  const rows = await sql.query(FIND_COMPANY_BY_ID_QUERY, {
    replacements: {
      companyId,
    },
    type: QueryTypes.SELECT,
  })

  return rows && rows.length > 0 ? rows[0] : null
}

/**
 *
 * @param {string} integratorId
 * @returns {Promise<{
 *   id: string,
 *   name: string,
 *   product: string,
 *   createdBy: string
 * }}
 */
export const getCompanyByIntegratorId = async (
  integratorId,
  integrationPartnerId,
) => {
  const { DB: sql } = services
  const rows = await sql.query(
    FIND_COMPANY_BY_INTEGRATOR_ID_QUERY,
    {
      replacements: {
        integratorId,
        integrationPartnerId,
      },
      type: QueryTypes.SELECT,
    },
  )

  return rows && rows.length > 0 ? rows[0] : null
}
