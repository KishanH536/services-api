import { softDeleteClientById } from '../../core/delete_project.js'
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

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    const client = await softDeleteClientById(userId, companyId, clientId)

    if (!client) {
      return error404(res, 'The client could not be found or has already been deleted')
    }

    return res.sendStatus(204)
  }
  catch (err) {
    req.logger.error(err, 'Error in deleting client')
    return error500(res)
  }
}
