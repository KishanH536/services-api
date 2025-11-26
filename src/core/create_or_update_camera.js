import {
  isEqual,
  isEmpty,
} from 'lodash-es'

import { QueryTypes } from 'sequelize'

import { analyticsFeaturesToId } from '../constants/index.js'

import { initDB } from '../db/index.js'

import createAdvancedRules from './create_advanced_rules.js'
import { getAdvancedRules } from './get_advanced_rules.js'
import updateAdvancedRules from './update_advanced_rules.js'
import addAnalyticsToView from './add_analytics_to_view.js'
import { deleteAnalytics } from './clean_and_delete_views.js'

const DEFAULT_VIEW_STATUS = { active: false }

// TODO - query should filter on user ID
const getCameraQuery = (idType = 'calipsa') =>
// Replacement property name is "id",
// Can be used for view id or integrator_id column, depending on idType.
  `
    SELECT v.id "id",
            v.site_id "siteId",
            v.integrator_id "integratorId",
            v.name "name",
            v.mask "masks",
            v.is_snapshot "snapshotSet",
            v.is_thermal "thermal",
            v.status "viewStatus",
            v.is_tampering "tampering"
    FROM public.view_currents v
    INNER JOIN public.site_currents sc
      ON sc.id = v.site_id
    INNER JOIN public.projects p
      ON sc.project_id = p.id
    INNER JOIN public.companies c
      ON p.company_id = c.id
    WHERE c.id = :companyId
      ${idType === 'calipsa' ? 'AND v.id = :id' : 'AND v.integrator_id = :id'}
  `

const addAnalytic = async (sql, transaction, viewId, analytic) => {
  const capabilityId = analyticsFeaturesToId.get(analytic.name)
  const config = analytic.value
  const stored = await sql.models.analytics.create(
    {
      viewId,
      capabilityId,
      config,
    },
    {
      transaction,
    },
  )
  return stored
}

const addAnalytics = async (sql, transaction, viewId, analytics) => {
  const analyticsNames = [
    'vehicleAnalysis',
    'personAnalysis',
    'sceneClassification',
    'multipleRiskAnalysis',
  ]

  const storedPromises = []
  for (const name of analyticsNames) {
    if (analytics?.[name]) {
      const result = addAnalytic(sql, transaction, viewId, {
        name,
        value: analytics[name],
      })
      storedPromises.push(result)
    }
  }

  const allStored = await Promise.all(storedPromises)

  if (!allStored.length) {
    return null
  }
}

const findView = async (sql, companyId, id, idType) => {
  const rows = await sql.query(getCameraQuery(idType), {
    replacements: {
      id,
      companyId,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })

  if (!(rows && rows.length)) {
    // not found
    return
  }

  const view = rows[0]
  await addAnalyticsToView(sql, view)

  return view
  // This should have been caught above, I think
  // return rows?.length ? rows[0] : undefined
}

const updateViewDb = async (
  sql,
  userId,
  view,
  {
    viewName,
    masks,
    thermal,
    siteId,
    status,
    tampering,
    tamperingConfig,
    analytics,
    snapshot,
  },
  advancedRules = null,
  transaction = null,
) => {
  // Change the siteId if it is not falsey and not the same as the current site ID.
  if (siteId && siteId !== view.siteId) {
    await sql.models.view.update(
      { siteId },
      {
        where: {
          id: view.id,
        },
        paranoid: false,
        logging: false,
        transaction,
      },
    )
  }

  // First, delete all existing analytics
  await deleteAnalytics(sql, transaction, [view.id])
  // Second, add the incoming analytics
  await addAnalytics(sql, transaction, view.id, analytics)

  // Get properties to update, only if they are different than the current values.
  const modifiedViewProps = {
    ...view.name !== viewName && { name: viewName },
    ...!isEqual(view.masks, masks) && { mask: masks },
    ...!isEqual(view.viewStatus, status) && { status },
    ...view.tampering !== tampering && { isTampering: tampering },
    ...view.thermal !== thermal && { isThermal: thermal },
  }
  // If tamperingConfig is passed, just write it, as that only comes from
  //    ref image update, which should always need its data updated
  if (tamperingConfig) {
    modifiedViewProps.tamperingConfig = tamperingConfig
  }

  // If snapshot is passed, write it, otherwise do not change it.
  // (don't want to reset it to `false` if we haven't actually set the snapshot image)
  if (snapshot !== undefined) {
    modifiedViewProps.isSnapshot = snapshot
  }

  if (!isEmpty(modifiedViewProps)) {
    await sql.models.viewCurrent.update(modifiedViewProps, {
      where: {
        id: view.id,
      },
      paranoid: false,
      transaction,
    })
  }

  // Update the advanced rules if they are passed
  let updatedAdvancedRules
  if (advancedRules) {
    await updateAdvancedRules(
      userId,
      view.id,
      advancedRules,
      transaction,
    )
    updatedAdvancedRules = await getAdvancedRules(view.id, transaction)
  }

  const updatedView = {
    integratorId: view.integratorId,
    calipsaViewId: view.id,
    name: viewName,
    masks,
    thermal,
    snapshotSet: view.snapshotSet,
    viewStatus: status,
    tampering,
    tamperingConfig,
    analytics,
    created: false,
  }

  if (updatedAdvancedRules?.length) {
    updatedView.advancedRules = updatedAdvancedRules
  }

  return updatedView
}

const findAndUpdateViewById = async (
  sql,
  companyId,
  userId,
  viewId,
  {
    viewName,
    masks,
    thermal,
    siteId,
    status,
    tampering,
    tamperingConfig,
    analytics,
    snapshot,
  },
  advancedRules,
  transaction,
) => {
  const view = await findView(sql, companyId, viewId, 'calipsa')

  if (!view) {
    return
  }

  return await updateViewDb(
    sql,
    userId,
    view,
    {
      viewName,
      masks,
      thermal,
      siteId,
      status,
      tampering,
      tamperingConfig,
      analytics,
      snapshot,
    },
    advancedRules,
    transaction,
  )
}

const createViewDb = async (
  sql,
  userId,
  siteId,
  {
    viewName,
    cameraIntegratorId,
    tokenId,
    objectDetection,
    masks,
    thermal,
    status,
    tampering,
    tamperingConfig,
    analytics,
  },
  advancedRules,
  transaction,
) => {
  const view = await sql.models.view.create(
    {
      userId,
      siteId,
      integratorId: cameraIntegratorId,
    },
    {
      logging: false,
      transaction,
    },
  )

  const viewCurrentData = {
    id: view.id,
    siteId,
    integratorId: cameraIntegratorId,
    tokenId,
    userId,
    name: viewName,
    isSnapshot: false,
    mask: masks,
    isThermal: thermal,
    status,
    isTampering: tampering,
    tamperingConfig,
  }

  // The objectDetection parameter allows Pelco Elevate cameras to self-register
  // without object detection enabled. To keep compatibility with the
  // add-camera handlers, an objectDetection that is not explicitly set will
  // leave the value unset, which is the current behavior. If the value is set
  // by the caller of createView, the set value will be
  // assigned as-is to the status object (i.e., if it's set, the caller must
  // have wanted it set).
  //
  // Could also explicitly set it to true in this case.
  //
  if (typeof objectDetection !== 'undefined') {
    viewCurrentData.status.isObjectDetection = objectDetection
  }

  const viewCurrent = await sql.models.viewCurrent.create(viewCurrentData, {
    logging: false,
    transaction,
  })

  // If there are features that need to be stored in the analytics table,
  // address those here
  await addAnalytics(sql, transaction, view.id, analytics)

  let createdRules
  if (advancedRules?.length) {
    createdRules = await createAdvancedRules(
      userId,
      view.id,
      advancedRules,
      transaction,
    )
  }

  return {
    integratorId: view.integratorId,
    calipsaViewId: view.id,
    name: viewCurrent.name,
    masks: viewCurrent.mask,
    snapshotSet: viewCurrent.isSnapshot,
    thermal: !!viewCurrent.isThermal,
    viewStatus: viewCurrent.status,
    tampering: viewCurrent.isTampering,
    tamperingConfig,
    analytics,
    advancedRules: createdRules,
    created: true,
  }
}

/**
 * @param {string} userId
 * @param {string} siteId
 * @param {Object<{viewName: string, cameraIntegratorId: string}>} camera
 * @param {Array} advancedRules
 *
 * @returns {Promise<{
 *   name: string,
 *   integratorId: string,
 *   calipsaViewId: string,
 *   masks: Array,
 *   snapshotSet: Boolean,
 *   thermal: Boolean,
 *   tampering: Boolean,
 *   vehicleAnalysis: Object,
 *   viewStatus: Object
 *   created: Boolean
 * }>}
 */
export const createView = async (
  userId,
  siteId,
  {
    viewName,
    cameraIntegratorId,
    objectDetection,
    masks = [],
    thermal = false,
    status = DEFAULT_VIEW_STATUS,
    tampering,
    analytics,
  },
  advancedRules,
) => {
  const sql = await initDB()

  const result = await sql.transaction(async t => await createViewDb(
    sql,
    userId,
    siteId,
    {
      viewName,
      cameraIntegratorId,
      objectDetection,
      masks,
      thermal,
      status,
      tampering,
      analytics,
    },
    advancedRules,
    t,
  ))

  return result
}

/**
 * @param {string} companyId
 * @param {string} viewId
 * @param {Promise<{viewName: string, mask: Array, siteId: string}>} newViewProps
 *
 * @returns {Promise<{
 *   name: string,
 *   integratorId: string,
 *   calipsaViewId: string,
 *   masks: Array,
 *   thermal: Boolean,
 *   snapshotSet: Boolean,
 *   thermal: Boolean,
 *   tampering: Boolean,
 *   tamperingConfig: Object,
 *   viewStatus: Object,
 *   created: Boolean
 * }>}
 */
export const updateView = async (
  companyId,
  userId,
  viewId,
  {
    viewName,
    siteId,
    masks = [],
    thermal = false,
    status = DEFAULT_VIEW_STATUS,
    tampering,
    tamperingConfig,
    analytics,
    // Need to explicitly pass snapshot to `updateViewDb` in order to update it.
    // `undefined` will do nothing.
    snapshot,
  },
  advancedRules,
) => {
  const sql = await initDB()

  const result = await sql.transaction(async t => {
    const view = await findAndUpdateViewById(
      sql,
      companyId,
      userId,
      viewId,
      {
        viewName,
        masks,
        thermal,
        siteId,
        status,
        tampering,
        tamperingConfig,
        analytics,
        snapshot,
      },
      advancedRules,
      t,
    )

    return view
  })

  return result
}
