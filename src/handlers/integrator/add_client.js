import { findOrCreateProject } from '../../core/find_or_create_project.js'
import updateProject from '../../core/update_project.js'

import {
  MY_BASE_URL_FOR_LINKS as myBaseUrl,
} from '../../../config/misc.js'
import {
  error500,
} from '../../common/error_response.js'

/**
 * @param {object} req
 * @param {object} res
 */
export default async (ctx, req, res) => {
  const { companyId } = req
  const { clientIntegratorId } = ctx.request.params
  const {
    displayName,
  } = ctx.request.body
  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    let project = await findOrCreateProject(companyId, clientIntegratorId, displayName)

    if (!project.created && project.name !== displayName) {
      project = await updateProject(companyId, project.id, { projectName: displayName })
    }

    const responseBody = {
      data: {
        id: project.id,
        type: 'client',
        attributes: {
          integratorId: clientIntegratorId,
          displayName,
        },
      },
    }
    responseBody.data.links = {
      self: `${myBaseUrl}/integrator/clients/${encodeURIComponent(clientIntegratorId)}`,
    }
    if (project.created) {
      res.location(responseBody.data.links.self).status(201)
    }
    else {
      res.status(200)
    }
    return res.json(responseBody)
  }
  catch (err) {
    req.logger.error(err, 'Error in adding client')
    return error500(res)
  }
}
