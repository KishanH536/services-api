import { ElevateErrorCodes } from '@msi-calipsa/error-codes'

import siteFromCompany from '../../core/site_from_company.js'
import getSharedSite from '../../utils/get_shared_site.js'
import {
  listCameras,
  listSharedCameras,
} from '../../core/list_cameras.js'
import { getAdvancedRulesByViewIds } from '../../core/get_advanced_rules.js'
import { View } from '../../api/serializers/index.js'
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
  const calipsaSiteId = ctx.request.params.siteId

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    // Check if the siteId belongs to the same company as the userId.
    const match = await siteFromCompany(userId, calipsaSiteId)
    let cameras

    if (match) {
      cameras = await listCameras(userId, calipsaSiteId)
    }
    else {
      // If the userId's company doesn't match the siteId's company,
      // check if the site is a shared site.
      const sharedSite = await getSharedSite(userId, calipsaSiteId)

      // If the site isn't a shared site, return 404 site not found.
      if (!sharedSite) {
        const { description, code } = ElevateErrorCodes.SITE_NOT_FOUND
        return error404(res, description, { code })
      }

      cameras = await listSharedCameras(userId, calipsaSiteId)
    }

    // Get the advanced rules (if necessary) for specific cameras
    const advancedRules = await getAdvancedRulesByViewIds(
      cameras
        .filter(c => c.viewStatus?.isUsingNewAdvancedRules)
        .map(c => c.calipsaViewId),
    )

    const camerasToSerialize = cameras.map(camera => {
      const cameraToSerialize = { ...camera }

      // Add the camera's advanced rules if necessary
      if (camera.viewStatus?.isUsingNewAdvancedRules) {
        cameraToSerialize.advancedRules = advancedRules
          .filter(r => r.viewId === camera.calipsaViewId)
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
      return cameraToSerialize
    })

    const responseBody = View.render(camerasToSerialize, calipsaSiteId)
    res.json(responseBody)
  }
  catch (err) {
    req.logger.error(
      {
        calipsaSiteId,
        userId,
        error: err,
      },
      'Error getting cameras',
    )

    return error500(res)
  }
}
