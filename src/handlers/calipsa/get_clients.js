import getProjects from '../../core/get_projects.js'
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

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    const clients = await getProjects(userId, companyId)

    const responseBody = {
      data: clients.map(client => ({
        id: client.id,
        type: 'client',
        attributes: {
          integratorId: client.integratorId,
          displayName: client.name,
        },
        links: {
          self: `${myBaseUrl}/clients/${client.id}`,
        },
      })),
      links: {
        self: `${myBaseUrl}/clients`,
      },
    }
    return res.status(200).json(responseBody)
  }
  catch (err) {
    req.logger.error(err, 'Error in getting clients')
    return error500(res)
  }
}
