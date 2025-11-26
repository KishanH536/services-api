import { findOrCreateProject } from '../../core/find_or_create_project.js'
import { findOrCreateSite } from '../../core/find_or_create_site.js'
import updateSite from '../../core/update_site.js'

import {
  MY_BASE_URL_FOR_LINKS as myBaseUrl,
} from '../../../config/misc.js'
import {
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
  const { clientIntegratorId } = ctx.request.params
  const { siteIntegratorId } = ctx.request.params
  const companyDefaultTimezone = req.company.defaultSitesTimezone

  let {
    displayName,
    timeZone = companyDefaultTimezone,
  } = ctx.request.body

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    const project = await findOrCreateProject(companyId, clientIntegratorId)
    const site = await findOrCreateSite(
      companyId,
      project.id,
      userId,
      siteIntegratorId,
      displayName,
      timeZone,
    )

    // Update the site name and time zone if necessary
    if (site.name !== displayName || site.timeZone !== timeZone) {
      const updatedSite = await updateSite(userId, site.id, displayName, timeZone)
      timeZone = updatedSite && updatedSite.timeZone
      displayName = updatedSite && updatedSite.name
    }

    const responseBody = {
      data: {
        id: site.id,
        type: 'site',
        attributes: {
          displayName,
          integratorId: siteIntegratorId,
          timeZone,
        },
      },
    }
    responseBody.data.links = {
      self: `${myBaseUrl}/integrator/clients/${encodeURIComponent(clientIntegratorId)}/sites/${encodeURIComponent(siteIntegratorId)}`,
    }
    if (site.created) {
      res.location(responseBody.data.links.self).status(201)
    }
    else {
      res.status(200)
    }
    return res.json(responseBody)
  }
  catch (err) {
    req.logger.error({
      siteIntegratorId,
      clientIntegratorId,
      userId,
      error: err,
    }, 'Error in adding site')
    return error500(res)
  }
}
