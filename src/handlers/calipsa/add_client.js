import { createProject } from '../../core/find_or_create_project.js'
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
  const { companyId } = req
  const {
    displayName,
  } = ctx.request.body
  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    const project = await createProject(companyId, null, displayName)
    const responseBody = {
      data: {
        id: project.id,
        type: 'client',
        attributes: {
          displayName: project.name,
        },
      },
    }
    responseBody.data.links = {
      self: `${myBaseUrl}/clients/${project.id}`,
    }
    res.location(responseBody.data.links.self).status(201)

    return res.json(responseBody)
  }
  catch (err) {
    req.logger.error(err, 'Error in adding client')
    return error500(res)
  }
}
