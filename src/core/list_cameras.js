import { QueryTypes } from 'sequelize'

import { initDB } from '../db/index.js'

import addAnalyticsToView from './add_analytics_to_view.js'

// NOTE: This query now sort alphabetically based on name, and this may
//       require an index on "name" if the queries are slow, and if we
//       introduce pagination for these lists.

const LIST_CAMERA_QUERY = `
  SELECT  v.created_at AS "createdAt",
          vc.updated_at AS "updatedAt",
          v.id AS "calipsaViewId",
          vc.integrator_id "integratorId",
          vc.name AS "name",
          vc.mask "masks",
          vc.is_snapshot "snapshotSet",
          vc.is_thermal "thermal",
          vc.status "viewStatus",
          vc.is_tampering "tampering",
          vc.tampering_config "tamperingConfig"
    FROM public.views v
    INNER JOIN public.view_currents vc
      ON vc.id = v.id
    INNER JOIN public.sites_all sa
      ON v.site_id = sa.id
    INNER JOIN public.projects p
      ON sa.project_id = p.id
    INNER JOIN public.companies c
      ON p.company_id = c.id
    INNER JOIN public.users u
      ON u.company_id = c.id  
    WHERE u.id = :userId
      AND sa.id = :calipsaSiteId
      AND v.deleted_at IS NULL
      AND sa.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND u.deleted_at IS NULL
      AND c.deleted_at IS NULL
    ORDER BY vc.name ASC
`
const LIST_SHARED_CAMERA_QUERY = `
  SELECT  v.created_at AS "createdAt",
          vc.updated_at AS "updatedAt",
          v.id AS "calipsaViewId",
          vc.integrator_id "integratorId",
          vc.name AS "name",
          vc.mask "masks",
          vc.is_snapshot "snapshotSet",
          vc.is_thermal "thermal",
          vc.status "viewStatus",
          vc.is_tampering "tampering",
          vc.tampering_config "tamperingConfig"
    FROM public.views v
    INNER JOIN public.view_currents vc
      ON vc.id = v.id
    INNER JOIN public.sites_all sa
      ON v.site_id = sa.id
    INNER JOIN public.projects p
      ON sa.project_id = p.id
    INNER JOIN public.companies c
      ON p.company_id = c.id
    INNER JOIN public.user_sites_permissions up
      ON sa.id = up.site_id
    WHERE sa.id = :calipsaSiteId
      AND up.user_id = :userId
      AND up.site_id = :calipsaSiteId
      AND up.permission_id = 'SHARED_SITE_USER'
      AND up.deleted_at IS NULL
      AND v.deleted_at IS NULL
      AND sa.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND c.deleted_at IS NULL
    ORDER BY vc.name ASC
`

const LIST_CAMERA_BY_TOKEN_ID_QUERY = `
  SELECT  v.created_at AS "createdAt",
          vc.updated_at AS "updatedAt",
          v.id AS "calipsaViewId",
          vc.integrator_id "integratorId",
          vc.token_id "tokenId",
          vc.name AS "name",
          vc.mask "masks",
          vc.is_snapshot "snapshotSet",
          vc.is_thermal "thermal",
          vc.status "viewStatus",
          vc.is_tampering "tampering",
          vc.tampering_config "tamperingConfig"
    FROM public.views v
    INNER JOIN public.view_currents vc
      ON vc.id = v.id
    INNER JOIN public.sites_all sa
      ON v.site_id = sa.id
    INNER JOIN public.projects p
      ON sa.project_id = p.id
    INNER JOIN public.companies c
      ON p.company_id = c.id
    INNER JOIN public.users u
      ON u.company_id = c.id
    WHERE u.id = :userId
      AND vc.token_id IN(:tokenIds)
      AND v.deleted_at IS NULL
      AND sa.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND u.deleted_at IS NULL
      AND c.deleted_at IS NULL
    ORDER BY vc.name ASC
`

const LIST_SHARED_CAMERAS_BY_TOKEN_ID_QUERY = `
  SELECT  v.created_at AS "createdAt",
          vc.updated_at AS "updatedAt",
          v.id AS "calipsaViewId",
          vc.integrator_id "integratorId",
          vc.token_id "tokenId",
          vc.name AS "name",
          vc.mask "masks",
          vc.is_snapshot "snapshotSet",
          vc.is_thermal "thermal",
          vc.status "viewStatus",
          vc.is_tampering "tampering",
          vc.tampering_config "tamperingConfig"
    FROM public.views v
    INNER JOIN public.view_currents vc
      ON vc.id = v.id
    INNER JOIN public.sites_all sa
      ON v.site_id = sa.id
    INNER JOIN public.projects p
      ON sa.project_id = p.id
    INNER JOIN public.companies c
      ON p.company_id = c.id
    INNER JOIN public.user_sites_permissions usp
      ON usp.site_id = v.site_id
    WHERE vc.token_id IN(:tokenIds)
      AND usp.user_id = :userId
      AND usp.permission_id = 'SHARED_SITE_USER'
      AND usp.deleted_at IS NULL
      AND v.deleted_at IS NULL
      AND sa.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND c.deleted_at IS NULL
    ORDER BY vc.name ASC
`

async function queryCameras(query, userId, calipsaSiteId) {
  const sql = await initDB()

  const rows = await sql.query(query, {
    replacements: {
      userId,
      calipsaSiteId,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })

  const analyticsPromises = []
  for (const row of rows) {
    analyticsPromises.push(addAnalyticsToView(sql, row))
  }
  await Promise.all(analyticsPromises)

  return rows
}

/**
 * @param {string} userId
 * @param {string} calipsaSiteId
 *
 * @returns {Promise<boolean>}
 */
export async function listCameras(userId, calipsaSiteId) {
  return await queryCameras(LIST_CAMERA_QUERY, userId, calipsaSiteId)
}

/**
 * @param {string} userId
 * @param {string} calipsaSiteId
 *
 * @returns {Promise<boolean>}
 */
export async function listSharedCameras(userId, calipsaSiteId) {
  return await queryCameras(LIST_SHARED_CAMERA_QUERY, userId, calipsaSiteId)
}

/**
 *
 * @param {string} userId
 * @param {string[]} tokenIds
 *
 * @returns  {Promise<Array<{
 *  calipsaViewId: string,
 *  integratorId: string,
 *  tokenId: string,
 *  name: string,
 *  masks: Array,
 *  snapshotSet: boolean,
 *  thermal: boolean,
 *  viewStatus: object,
 *  tampering: boolean,
 *  tamperingConfig: object,
 *  createdAt: string,
 *  updatedAt: string,
 * }>>}
 */

// Retrieves all cameras where tokenId matches any token IDs
// in a given array of token IDs
export async function listCamerasByTokenIds(userId, tokenIds) {
  const sql = await initDB()

  return await sql.query(LIST_CAMERA_BY_TOKEN_ID_QUERY, {
    replacements: {
      userId,
      tokenIds,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })
}

/**
 *
 * @param {string} userId
 * @param {string[]} tokenIds
 *
 * @returns  {Promise<Array<{
 *  calipsaViewId: string,
 *  integratorId: string,
 *  tokenId: string,
 *  name: string,
 *  masks: Array,
 *  snapshotSet: boolean,
 *  thermal: boolean,
 *  viewStatus: object,
 *  tampering: boolean,
 *  tamperingConfig: object,
 *  createdAt: string,
 *  updatedAt: string,
 * }>>}
 */

// Retrieves all cameras for a shared site where tokenId matches any token IDs
// in a given array of token IDs, and the site has been shared with the given userId.
export async function listSharedCamerasByTokenIds(userId, tokenIds) {
  const sql = await initDB()

  return await sql.query(LIST_SHARED_CAMERAS_BY_TOKEN_ID_QUERY, {
    replacements: {
      userId,
      tokenIds,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })
}
