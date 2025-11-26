import { getSiteById as getSite } from '../../core/get_site.js'

import {
  MY_BASE_URL_FOR_LINKS as myBaseUrl,
} from '../../../config/misc.js'
import {
  error500,
  error404,
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
    const site = await getSite(userId, siteId)

    if (!site) {
      return error404(res, 'Unable to find site.')
    }

    const responseBody = {
      data: {
        id: site.calipsaSiteId,
        type: 'site',
        attributes: {
          displayName: site.name,
          timeZone: site.timeZone,
        },
      },
    }
    responseBody.data.links = {
      self: `${myBaseUrl}/sites/${site.calipsaSiteId}`,
    }
    res.status(200)

    return res.json(responseBody)
  }
  catch (err) {
    req.logger.error({
      siteId,
      userId,
      error: err,
    }, 'Error in getting site')
    return error500(res)
  }
}
