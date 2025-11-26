import updateSite from '../../core/update_site.js'

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
  const { siteId } = ctx.request.params
  const companyDefaultTimezone = req.company.defaultSitesTimezone

  const {
    siteName,
    timeZone = companyDefaultTimezone,
  } = ctx.request.body

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    const site = await updateSite(userId, siteId, siteName, timeZone)

    if (!site) {
      const errmsg = 'Site not found, unable to update'
      req.logger.error({ siteId }, errmsg)
      return error404(res, errmsg)
    }

    const responseBody = {
      data: {
        id: siteId,
        type: 'site',
        attributes: {
          displayName: site.name,
          timeZone: site.timeZone,
        },
      },
    }
    responseBody.data.links = {
      self: `${myBaseUrl}/sites/${siteId}`,
    }

    res.status(200)
    return res.json(responseBody)
  }
  catch (err) {
    req.logger.error({
      siteId,
      userId,
      siteName,
      error: err,
    }, 'Error in updating site')
    error500(res)
  }
}
