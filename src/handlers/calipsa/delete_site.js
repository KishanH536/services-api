import { softDeleteSiteById } from '../../core/delete_site.js'
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
  const { siteId } = ctx.request.params

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    const site = await softDeleteSiteById(userId, siteId)

    if (!site) {
      return error404(res, 'The site could not be found or has already been deleted')
    }

    return res.sendStatus(204)
  }
  catch (err) {
    req.logger.error(err, 'Error in deleting site')
    return error500(res)
  }
}
