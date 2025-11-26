import {
  getSiteByIntegratorId,
} from '../../core/get_site.js'
import { listCameras } from '../../core/list_cameras.js'
import { getAdvancedRulesByViewIds } from '../../core/get_advanced_rules.js'
import { transformToFeatures } from '../../common/view_features.js'
import { rowsToAdvancedRuleFeatures } from '../../common/features/advanced_rules.js'

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
  const { clientIntegratorId } = ctx.request.params
  const { siteIntegratorId } = ctx.request.params

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    const site = await getSiteByIntegratorId(userId, clientIntegratorId, siteIntegratorId)
    if (!site) {
      return error404(res, 'Unable to find site with provided site integrator ID.')
    }

    const cameras = await listCameras(userId, site.calipsaSiteId)

    // Get the advanced rules (if necessary) for specific cameras
    const advancedRules = await getAdvancedRulesByViewIds(
      cameras
        .filter(c => c.viewStatus?.isUsingNewAdvancedRules)
        .map(c => c.calipsaViewId),
    )

    const responseBody = {
      data: cameras.map(camera => {
        const features = transformToFeatures(camera)
        if (camera.viewStatus?.isUsingNewAdvancedRules) {
          const ruleRows = advancedRules.filter(r => r.viewId === camera.calipsaViewId)
          features.advancedRules = rowsToAdvancedRuleFeatures(ruleRows)
        }
        else {
          req.logger.warn(
            {
              viewId: camera.calipsaViewId,
              status: camera.viewStatus,
            },
            'Camera is not using new advanced rules',
          )
        }

        const elem = {
          id: camera.calipsaViewId,
          type: 'view',
          attributes: {
            integratorId: camera.integratorId,
            displayName: camera.name,
            created: camera.createdAt,
            updated: camera.updatedAt,
            active: camera.viewStatus?.active || false,
            snapshotSet: camera.snapshotSet,
            masks: camera.masks,
            thermal: camera.thermal,
            features,
          },
          links: {
            self: `${myBaseUrl}/views/${camera.calipsaViewId}`,
          },
        }
        if (camera.snapshotSet) {
          elem.links['http://calipsa.io/relation/current-image'] = `${myBaseUrl}/views/${camera.calipsaViewId}/snapshot`
        }
        return elem
      }),
      links: {
        self: `${myBaseUrl}/integrator/clients/${encodeURIComponent(clientIntegratorId)}/sites/${encodeURIComponent(siteIntegratorId)}/views`,
      },
    }

    res.json(responseBody)
  }
  catch (err) {
    req.logger.error({
      clientIntegratorId,
      siteIntegratorId,
      userId,
      error: err,
    }, 'Error getting cameras')

    return error500(res)
  }
}
