import { createView } from '../../core/create_or_update_camera.js'
import { getSiteById } from '../../core/get_site.js'
import { checkFeatureCapabilities } from '../../utils/check_capabilities.js'
import {
  transformToFeatures,
  transformFromFeatures,
  DEFAULT_FEATURES,
} from '../../common/view_features.js'

import { MY_BASE_URL_FOR_LINKS as myBaseUrl } from '../../../config/misc.js'
import {
  error403,
  error404,
  error500,
} from '../../common/error_response.js'

import {
  advancedRuleFeaturesToRows,
  rowsToAdvancedRuleFeatures,
} from '../../common/features/advanced_rules.js'

/**
 * @param {object} ctx
 * @param {object} req
 * @param {object} res
 */
export default async (ctx, req, res) => {
  const { userId } = req.auth
  const { siteId } = ctx.request.params
  const {
    displayName,
    masks = [],
    thermal = false,
    features = DEFAULT_FEATURES,
  } = ctx.request.body

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    // Check that the site exists.
    const site = await getSiteById(userId, siteId)

    if (!site) {
      return error404(res)
    }

    // Capabilities check.
    const {
      valid,
      missingCapabilities,
    } = await checkFeatureCapabilities(req.integratorCompanyId || req.companyId, features)

    if (!valid) {
      req.logger.error({
        missingCapabilities,
        companyId: req.companyId,
      }, 'Capabilities check failed')
      return error403(res)
    }

    // Transform feature-style to DB-entry-style for writing to DB
    const advancedRules = advancedRuleFeaturesToRows(features.advancedRules)

    const camera = await createView(
      userId,
      siteId,
      {
        viewName: displayName,
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

    // Transform created rules back to feature-style for response.
    const featureAdvancedRules = rowsToAdvancedRuleFeatures(camera.advancedRules)

    const responseBody = {
      data: {
        id: camera.calipsaViewId,
        type: 'view',
        attributes: {
          integratorId: camera.integratorId,
          displayName: camera.name,
          masks: camera.masks,
          snapshotSet: camera.snapshotSet,
          thermal: camera.thermal,
          features: {
            ...transformToFeatures(camera),
            advancedRules: featureAdvancedRules,
          },
        },
      },
    }
    responseBody.data.links = {
      self: `${myBaseUrl}/views/${camera.calipsaViewId}`,
    }
    res.location(responseBody.data.links.self).status(201)

    return res.json(responseBody)
  }
  catch (err) {
    req.logger.error({
      siteId,
      userId,
      error: err,
    }, 'Error in adding cameras')
    error500(res)
  }
}
