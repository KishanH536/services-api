import { QueryTypes } from 'sequelize'

import { services } from '../services/index.js'

const FIND_COMPANIES_QUERY = `
  SELECT c.id AS id,
          c.name AS name,
          c.product AS product,
          c.alarm_retention_days AS "alarmRetentionDays",
          c.created_by AS "createdBy",
          c.integrator_id AS "integratorId"
  FROM public.companies c
  WHERE c.created_by = :partnerUserId
    AND c.deleted_at IS NULL
  ORDER BY c.id
`

const FIND_COMPANIES_QUERY_AFTER = `
  SELECT c.id AS id,
          c.name AS name,
          c.product AS product,
          c.alarm_retention_days AS "alarmRetentionDays",
          c.created_by AS "createdBy",
          c.integrator_id AS "integratorId"
  FROM public.companies c
  WHERE c.created_by = :partnerUserId
    AND c.deleted_at IS NULL
    AND c.id > :pageAfter
  ORDER BY c.id
  LIMIT :pageSize
`

const FIND_COMPANIES_QUERY_BEFORE = `
  SELECT c.id AS id,
          c.name AS name,
          c.product AS product,
          c.alarm_retention_days AS "alarmRetentionDays",
          c.created_by AS "createdBy",
          c.integrator_id AS "integratorId"
  FROM public.companies c
  WHERE c.created_by = :partnerUserId
    AND c.deleted_at IS NULL
    AND c.id < :pageBefore
  ORDER BY c.id DESC
  LIMIT :pageSize
`

/**
 * @param {string} partnerUserId
 * @param {object} { pageSize, pageAfter }
 *
 * @returns {Promise<{
 *   id: string,
 *   name: string,
 *   product: string
 *   alarmRetentionDays: number,
 *   createdBy: string
 * }}
 */
export const getCompaniesByPartnerUserId = async (
  partnerUserId,
  {
    pageSize,
    pageAfter = '00000000-0000-0000-0000-000000000000',
    pageBefore,
  },
) => {
  const { DB: sql } = services
  const queryString = pageSize
    ? pageBefore
      ? FIND_COMPANIES_QUERY_BEFORE
      : FIND_COMPANIES_QUERY_AFTER
    : FIND_COMPANIES_QUERY

  const rows = await sql.query(queryString, {
    replacements: {
      partnerUserId,
      pageSize,
      pageAfter,
      pageBefore,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })

  return rows
}
