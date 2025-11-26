import { QueryTypes } from 'sequelize'

import { initDB } from '../db/index.js'

import { cleanAndDeleteViews } from './clean_and_delete_views.js'

const getCameraQuery = (idType = 'calipsa') =>
  // Replacement property name is "id",
  // Can be used for view id or integrator_id column, depending on idType.
  `
    SELECT vc.id "id",
          vc.integrator_id "integratorId",
          vc.tampering_config "tamperingConfig",
          sa.deleted_at "siteDeletedAt",
          p.deleted_at "projectDeletedAt"
    FROM public.view_currents vc
      INNER JOIN public.sites_all sa
        ON sa.id = vc.site_id
      INNER JOIN public.projects p
        ON sa.project_id = p.id
      INNER JOIN public.companies c
        ON p.company_id = c.id
      INNER JOIN public.users u
        ON u.company_id = c.id
    WHERE u.id = :userId
      ${idType === 'calipsa' ? 'AND vc.id = :id' : 'AND vc.integrator_id = :id'}
      AND c.deleted_at IS NULL
    ORDER BY vc.created_at DESC
    LIMIT 1
  `

const softDeleteCamera = async (userId, id, idType = 'calipsa') => {
  const sql = await initDB()

  const query = getCameraQuery(idType)

  const rows = await sql.query(query, {
    replacements: {
      userId,
      id,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })

  const view = rows?.length && rows[0]

  if (!view) {
    // If there is no view, return null.
    return null
  }

  // View exists, so soft delete it.
  const deletedView = await sql.transaction(async (t) => {
    const [affectedCount, affectedRows] = await cleanAndDeleteViews(sql, t, [view])

    if (!affectedCount) {
      return null
    }

    return affectedRows[0]
  })

  if (!deletedView) {
    return null
  }

  return {
    ...deletedView,
    siteDeletedAt: view.siteDeletedAt,
    projectDeletedAt: view.projectDeletedAt,
  }
}

export const softDeleteCameraByIntegratorId = async (userId, id) =>
  await softDeleteCamera(userId, id, 'integrator')

export const softDeleteCameraById = async (userId, id) =>
  await softDeleteCamera(userId, id, 'calipsa')

export const softDeleteSharedCameraById = async (userId, id) =>
  await softDeleteCamera(userId, id, 'shared')
