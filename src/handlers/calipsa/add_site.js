import { createSite } from '../../core/find_or_create_site.js'
import getProject from '../../core/get_project.js'

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
  const { companyId } = req
  const { userId } = req.auth
  const { clientId } = ctx.request.params
  const companyDefaultTimezone = req.company.defaultSitesTimezone

  // timeZone defaults to company default setting if not defined
  const {
    siteName,
    timeZone = companyDefaultTimezone,
  } = ctx.request.body

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    // Check that the client exists.
    const client = await getProject(companyId, clientId)

    if (!client) {
      return error404(res)
    }

    // if using Calipsa-style route, always create.
    const site = await createSite(clientId, userId, null, siteName, timeZone)

    const responseBody = {
      data: {
        id: site.id,
        type: 'site',
        attributes: {
          displayName: site.name,
          timeZone,
        },
      },
    }
    responseBody.data.links = {
      self: `${myBaseUrl}/sites/${site.id}`,
    }

    res.location(responseBody.data.links.self).status(201)

    return res.json(responseBody)
  }
  catch (err) {
    req.logger.error({
      siteName,
      clientId,
      userId,
      error: err,
    }, 'Error in adding site')
    return error500(res)
  }
}
