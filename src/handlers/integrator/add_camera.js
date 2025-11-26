import {
  createView,
  updateView,
} from '../../core/create_or_update_camera.js'
import { findOrCreateProject } from '../../core/find_or_create_project.js'
import { findOrCreateSite } from '../../core/find_or_create_site.js'
import { getView as retrieveCameraData } from '../../core/retrieve_camera_data.js'
import { checkFeatureCapabilities } from '../../utils/check_capabilities.js'
import {
  advancedRuleFeaturesToRows,
  rowsToAdvancedRuleFeatures,
} from '../../common/features/advanced_rules.js'
import {
  transformToFeatures,
  transformFromFeatures,
  DEFAULT_FEATURES,
} from '../../common/view_features.js'

import {
  MY_BASE_URL_FOR_LINKS as myBaseUrl,
} from '../../../config/misc.js'
import {
  error500,
  error403,
} from '../../common/error_response.js'

/**
 * @param {object} ctx
 * @param {object} req
 * @param {object} res
 */
export default async (ctx, req, res) => {
  const { userId } = req.auth
  const { companyId } = req
  const companyDefaultTimezone = req.company.defaultSitesTimezone
  const { clientIntegratorId } = ctx.request.params
  const { siteIntegratorId } = ctx.request.params
  const { cameraIntegratorId } = ctx.request.params
  const {
    displayName,
    masks = [],
    thermal = false,
    features = DEFAULT_FEATURES,
  } = ctx.request.body

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    const client = await findOrCreateProject(companyId, clientIntegratorId)
    const site = await findOrCreateSite(
      companyId,
      client.id,
      userId,
      siteIntegratorId,
      /* siteName */ null,
      companyDefaultTimezone,
    )

    // Capabilities check.
    const {
      valid,
      missingCapabilities,
    } = await checkFeatureCapabilities(req.integratorCompanyId || req.companyId, features)
    if (!valid) {
      req.logger.error({
        missingCapabilities,
        companyId,
      }, 'Capabilities check failed')
      return error403(res)
    }

    // Need to check here to see if the view is created,
    // because we need to know whether or not to use the new advanced rules.
    const existingView = await retrieveCameraData(userId, cameraIntegratorId, 'motorola')
    let view

    if (!existingView) {
      // If the view doesn't exist yet, always use the new advanced rules.
      const advancedRules = advancedRuleFeaturesToRows(features.advancedRules)

      view = await createView(
        userId,
        site.id,
        {
          viewName: displayName || cameraIntegratorId,
          cameraIntegratorId,
          masks,
          thermal,
          ...transformFromFeatures(
            features,
            {
              isUsingNewAdvancedRules: true,
            },
          ),
        },
        advancedRules,
      )
    }
    else {
      // The view already exists, so update it, using advanced rules only if specified.
      const isUsingNewAdvancedRules = existingView.viewStatus?.isUsingNewAdvancedRules

      view = await updateView(
        companyId,
        userId,
        existingView.viewId,
        {
          viewName: displayName || cameraIntegratorId,
          siteId: site.id,
          masks,
          thermal,
          ...transformFromFeatures(features, { isUsingNewAdvancedRules }),
        },
        isUsingNewAdvancedRules && advancedRuleFeaturesToRows(features.advancedRules),
      )
    }

    const createdOrUpdatedFeatures = transformToFeatures(view)
    if (view.viewStatus?.isUsingNewAdvancedRules) {
      // advancedRules are returned as a property on the camera object.
      createdOrUpdatedFeatures.advancedRules = rowsToAdvancedRuleFeatures(view.advancedRules)
    }
    else {
      req.logger.warn(
        {
          viewId: view.calipsaViewId,
          status: view.viewStatus,
        },
        'Camera is not using new advanced rules',
      )
    }

    const responseBody = {
      data: {
        id: view.calipsaViewId,
        type: 'view',
        attributes: {
          integratorId: view.integratorId,
          displayName: view.name,
          masks: view.masks,
          snapshotSet: view.snapshotSet,
          thermal: view.thermal,
          features: createdOrUpdatedFeatures,
        },
      },
    }
    responseBody.data.links = {
      self: `${myBaseUrl}/integrator/views/${encodeURIComponent(cameraIntegratorId)}`,
    }

    if (view.created) {
      res.location(responseBody.data.links.self).status(201)
    }
    else {
      res.status(200)
    }
    return res.json(responseBody)
  }
  catch (err) {
    req.logger.error({
      cameraIntegratorId,
      siteIntegratorId,
      clientIntegratorId,
      userId,
      error: err,
    }, 'Error in adding cameras')
    error500(res)
  }
}
