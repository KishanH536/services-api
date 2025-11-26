import { getView as retrieveCameraData } from '../../core/retrieve_camera_data.js'
import { transformToFeatures } from '../../common/view_features.js'
import { getAdvancedRules } from '../../core/get_advanced_rules.js'
import { rowsToAdvancedRuleFeatures } from '../../common/features/advanced_rules.js'

import {
  API_SERVER_BASE_URL_FOR_LINKS as apiServerBaseUrl,
} from '../../../config/api_server.js'
import {
  MY_BASE_URL_FOR_LINKS as myBaseUrl,
} from '../../../config/misc.js'
import {
  error404,
  error500,
} from '../../common/error_response.js'

/**
 * @param {object} ctx
 * @param {object} req
 * @param {object} res
 */
export default async (ctx, req, res) => {
  const { userId } = req.auth
  const { viewId } = ctx.request.params

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    const camera = await retrieveCameraData(userId, viewId, 'calipsa')

    if (!camera) {
      return error404(res, 'The camera could not be found')
    }

    const features = transformToFeatures(camera)
    if (camera.viewStatus?.isUsingNewAdvancedRules) {
      const advancedRules = await getAdvancedRules(viewId)
      features.advancedRules = rowsToAdvancedRuleFeatures(advancedRules)
    }
    else {
      req.logger.warn(
        {
          viewId,
          status: camera.viewStatus,
        },
        'Camera is not using new advanced rules',
      )
    }

    const responseBody = {
      data: {
        id: camera.viewId,
        type: 'view',
        attributes: {
          integratorId: camera.integratorId,
          displayName: camera.viewName,
          created: camera.createdAt,
          updated: camera.updatedAt,
          masks: camera.masks,
          snapshotSet: camera.snapshotSet,
          thermal: camera.thermal,
          features,
        },
      },
    }

    responseBody.data.links = {
      self: `${myBaseUrl}/views/${camera.viewId}`,
      'http://calipsa.io/relation/legacy-site': `${apiServerBaseUrl}/site/${camera.siteId}`,
    }
    if (camera.snapshotSet) {
      responseBody.data.links['http://calipsa.io/relation/current-image'] = `${myBaseUrl}/views/${camera.viewId}/snapshot`
    }

    return res.status(200).json(responseBody)
  }
  catch (err) {
    req.logger.error(err, 'Error in getting camera')
    return error500(res)
  }
}
