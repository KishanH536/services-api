import { softDeleteCameraByIntegratorId } from '../../core/delete_camera.js'
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
  const { cameraIntegratorId } = ctx.request.params

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    const camera = await softDeleteCameraByIntegratorId(userId, cameraIntegratorId)

    if (!camera || camera.siteDeletedAt || camera.projectDeletedAt) {
      return error404(res, 'The camera could not be found or has already been deleted')
    }

    return res.sendStatus(204)
  }
  catch (err) {
    req.logger.error(err, 'Error in deleting camera')
    return error500(res)
  }
}
