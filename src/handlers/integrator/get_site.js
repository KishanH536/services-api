import { getSiteByIntegratorId as getSite } from '../../core/get_site.js'

import {
  MY_BASE_URL_FOR_LINKS as myBaseUrl,
} from '../../../config/misc.js'
import {
  error500,
  error404,
} from '../../common/error_response.js'

/**
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
    const site = await getSite(userId, clientIntegratorId, siteIntegratorId)

    if (!site) {
      return error404(res, 'Unable to find site.')
    }

    const responseBody = {
      data: {
        id: site.calipsaSiteId,
        type: 'site',
        attributes: {
          displayName: site.name,
          integratorId: site.integratorId,
          timeZone: site.timeZone,
        },
      },
    }
    responseBody.data.links = {
      self: `${myBaseUrl}/integrator/clients/${encodeURIComponent(clientIntegratorId)}/sites/${encodeURIComponent(siteIntegratorId)}`,
    }
    res.status(200)

    return res.json(responseBody)
  }
  catch (err) {
    req.logger.error({
      siteName: siteIntegratorId,
      clientName: clientIntegratorId,
      userId,
      error: err,
    }, 'Error in getting site')
    return error500(res)
  }
}
