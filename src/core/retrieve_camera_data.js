import { QueryTypes } from 'sequelize'

import { initDB } from '../db/index.js'

import addAnalyticsToView from './add_analytics_to_view.js'

const GET_CAMERA_DATA_QUERY = `
  SELECT vc.id "viewId",
         vc.integrator_id "integratorId",
         vc.created_at "createdAt",
         vc.updated_at "updatedAt",
         vc.user_id "userId",
         vc.company_id "companyId",
         sc.id "siteId",
         sc.name "siteName",
         sc.project_id "projectId",
         sc.timezone "siteTimezone",
         vc.name "viewName",
         vc.mask "masks",
         vc.status "viewStatus",
         vc.is_snapshot "snapshotSet",
         vc.is_thermal "thermal",
         vc.is_tampering "tampering",
         vc.tampering_config "tamperingConfig",
         c.is_forensic_unlocked "isForensicUnlocked",
         c.is_advanced_forensic_unlocked "isAdvancedForensicUnlocked"
  FROM public.view_currents vc
    INNER JOIN public.site_currents sc
      ON sc.id = vc.site_id
    INNER JOIN public.companies c
      ON vc.company_id = c.id
    INNER JOIN public.users u
      ON u.company_id = c.id
  WHERE u.id = :userId
    AND vc.id = :id
    AND c.deleted_at IS NULL
    AND u.deleted_at IS NULL
`

const GET_MOTOROLA_CAMERA_DATA_QUERY = `
  SELECT vc.id "viewId",
         vc.integrator_id "integratorId",
         vc.created_at "createdAt",
         vc.updated_at "updatedAt",
         vc.user_id "userId",
         vc.company_id "companyId",
         sc.id "siteId",
         sc.name "siteName",
         sc.project_id "projectId",
         sc.timezone "siteTimezone",
         vc.name "viewName",
         vc.mask "masks",
         vc.status "viewStatus",
         vc.is_snapshot "snapshotSet",
         vc.is_thermal "thermal",
         vc.is_tampering "tampering",
         vc.tampering_config "tamperingConfig",
         c.is_forensic_unlocked "isForensicUnlocked",
         c.is_advanced_forensic_unlocked "isAdvancedForensicUnlocked"
  FROM public.view_currents vc
    INNER JOIN public.site_currents sc
      ON sc.id = vc.site_id
    INNER JOIN public.companies c
      ON vc.company_id = c.id
    INNER JOIN public.users u
      ON u.company_id = c.id
  WHERE u.id = :userId
    AND vc.integrator_id = :id
    AND c.deleted_at IS NULL
    AND u.deleted_at IS NULL
`

// When getting a view, analytics are added to the view object with the
// "analytics" attribute. That attribute refers to an object that contains
// all of the analytics associated with the view, each of which is an object
// containing the configuration for that analytic, and which is named for the
// name of the analytic.
/**
 * @param {string} userId
 * @param {string} id
 *
 * @returns {Promise<{
 *  viewId: string;
 *  integratorId: string;
 *  siteId: string;
 *  siteName: string;
 *  projectId: string;
 *  companyId: string;
 *  masks: Array;
 *  viewStatus: object;
 *  viewName: string;
 *  snapshotSet: boolean;
 *  thermal: boolean;
 *  tampering: boolean;
 *  tamperingConfig: object;
 *  analytics: object;
 *  siteTimezone: string;
 *  isForensicUnlocked: boolean;
 *  isAdvancedForensicUnlocked: boolean;
 * }>}
 */
export const getView = async (
  userId,
  id,
  idType = 'calipsa',
  options = {},
) => {
  const sql = await initDB()

  const query = idType === 'calipsa' ? GET_CAMERA_DATA_QUERY : GET_MOTOROLA_CAMERA_DATA_QUERY

  const {
    transaction = null,
    intentToUpdate = false,
  } = options

  const rows = await sql.query(query, {
    replacements: {
      userId,
      id,
    },
    type: QueryTypes.SELECT,
    logging: false,
    transaction,
    useMaster: intentToUpdate,
  })

  if (rows && rows.length > 0) {
    const camera = rows[0]
    await addAnalyticsToView(
      sql,
      camera,
      transaction,
      intentToUpdate, // useWriter: true if intent is to update.
    )

    return {
      ...camera,
      thermal: !!camera.thermal,
    }
  }

  return null
}
