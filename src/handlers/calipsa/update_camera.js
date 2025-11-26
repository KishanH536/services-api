import {
  getView,
} from '../../core/retrieve_camera_data.js'
import { updateView } from '../../core/create_or_update_camera.js'
import { checkFeatureCapabilities } from '../../utils/check_capabilities.js'
import {
  transformToFeatures,
  transformFromFeatures,
  DEFAULT_FEATURES,
} from '../../common/view_features.js'

import {
  MY_BASE_URL_FOR_LINKS as myBaseUrl,
} from '../../../config/misc.js'
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
  const { viewId } = ctx.request.params
  const { userId } = req.auth
  const {
    displayName,
    masks = [],
    thermal = false,
    features = DEFAULT_FEATURES,
  } = ctx.request.body
  const {
    companyId,
    integratorCompanyId,
  } = req

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    // Check that the view belongs to the user.
    const view = await getView(userId, viewId, 'calipsa')
    if (!view) {
      const errMsg = 'View not found; unable to update.'
      req.logger.error({ viewId }, errMsg)
      return error404(res, errMsg)
    }

    // Capabilities check.
    const {
      valid, missingCapabilities,
    } = await checkFeatureCapabilities(integratorCompanyId || companyId, features)

    if (!valid) {
      req.logger.error({
        missingCapabilities,
        companyId,
      }, 'Capabilities check failed')
      return error403(res)
    }

    // The view already exists, so update it, using advanced rules only if specified.
    const isUsingNewAdvancedRules = view.viewStatus?.isUsingNewAdvancedRules

    const updatedView = await updateView(
      companyId,
      userId,
      viewId,
      {
        viewName: displayName,
        masks,
        thermal,
        ...transformFromFeatures(features, { isUsingNewAdvancedRules }),
      },
      isUsingNewAdvancedRules && advancedRuleFeaturesToRows(features.advancedRules),
    )

    if (!updatedView) {
      const errmsg = 'View not found, unable to update'
      req.logger.error({ viewId }, errmsg)
      return error404(res, errmsg)
    }

    const updatedFeatures = transformToFeatures(updatedView)
    if (updatedView.viewStatus?.isUsingNewAdvancedRules) {
      updatedFeatures.advancedRules = rowsToAdvancedRuleFeatures(updatedView.advancedRules)
    }
    else {
      req.logger.warn(
        {
          viewId: updatedView.calipsaViewId,
          status: updatedView.viewStatus,
        },
        'Camera is not using new advanced rules',
      )
    }

    const responseBody = {
      data: {
        id: updatedView.calipsaViewId,
        type: 'view',
        attributes: {
          integratorId: updatedView.integratorId,
          displayName: updatedView.name,
          masks: updatedView.masks,
          snapshotSet: updatedView.snapshotSet,
          thermal: updatedView.thermal,
          features: updatedFeatures,
        },
      },
    }
    responseBody.data.links = {
      self: `${myBaseUrl}/views/${updatedView.calipsaViewId}`,
    }

    res.status(200)
    return res.json(responseBody)
  }
  catch (err) {
    req.logger.error({
      viewId,
      companyId,
      error: err,
    }, 'Error in updating cameras')
    error500(res)
  }
}
