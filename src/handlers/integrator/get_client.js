import findProjectByIntegratorId from '../../core/find_project_by_integrator_id.js'
import {
  MY_BASE_URL_FOR_LINKS as myBaseUrl,
} from '../../../config/misc.js'
import {
  error404,
  error500,
} from '../../common/error_response.js'

/**
 * @param {object} req
 * @param {object} res
 */
export default async (ctx, req, res) => {
  const { companyId } = req
  const { clientIntegratorId } = ctx.request.params

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    const client = await findProjectByIntegratorId(companyId, clientIntegratorId)

    if (!client) {
      return error404(res, 'The client could not be found')
    }

    const responseBody = {
      data: {
        id: client.id,
        type: 'client',
        attributes: {
          integratorId: client.integratorId,
          displayName: client.name,
        },
      },
    }
    responseBody.data.links = {
      self: `${myBaseUrl}/integrator/clients/${encodeURIComponent(client.integratorId)}`,
    }
    return res.status(200).json(responseBody)
  }
  catch (err) {
    req.logger.error(err, 'Error in getting client')
    return error500(res)
  }
}
