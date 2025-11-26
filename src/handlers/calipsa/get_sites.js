import getProject from '../../core/get_project.js'
import { getSitesByClientId } from '../../core/get_sites.js'
import { Site } from '../../api/serializers/index.js'
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
  const { companyId } = req
  const { clientId } = ctx.request.params
  const shared = ctx.request.query?.shared

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    const client = await getProject(companyId, clientId)

    if (!client) {
      return error404(res, 'The client could not be found')
    }

    const sitesToBeSerialized = await getSitesByClientId(userId, client.id)

    const responseBody = Site.render(sitesToBeSerialized, clientId, shared)

    return res.status(200).json(responseBody)
  }
  catch (err) {
    req.logger.error(err, 'Error in getting sites')
    return error500(res)
  }
}
