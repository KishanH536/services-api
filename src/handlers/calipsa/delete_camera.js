import {
  softDeleteCameraById,
  softDeleteSharedCameraById,
} from '../../core/delete_camera.js'
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
  const { viewId } = ctx.request.params
  const { userId } = req.auth // userId for view owner or sharee of a shared site

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    let view = await softDeleteCameraById(userId, viewId)

    if (!view) {
      // If the view was not soft deleted, attempt the soft deletion with the user
      // as the sharee of a shared site.
      view = await softDeleteSharedCameraById(userId, viewId)
    }

    if (!view || view.siteDeletedAt || view.projectDeletedAt) {
      return error404(res, 'The view could not be found or has already been deleted')
    }

    return res.sendStatus(204)
  }
  catch (err) {
    req.logger.error(err, 'Error in deleting view')
    return error500(res)
  }
}
