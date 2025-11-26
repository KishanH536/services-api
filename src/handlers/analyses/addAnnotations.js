import { services } from '../../services/index.js'

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
  const {
    companyId,
    logger,
  } = req
  const { analysisId } = ctx.request.params
  const { description } = ctx.request.body

  const {
    Dynamo: dynamo,
    Redshift: redshift,
  } = services

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    // Get analysis result from DynamoDB:
    const analysis = await dynamo.getAnalysisResult(companyId, analysisId)

    if (!analysis) {
      return error404(res)
    }

    // Add annotation to Redshift:
    await redshift.insertAnnotation(analysisId, description)
    return res.sendStatus(204)
  }
  catch (err) {
    logger.error(err, 'Error adding annotation')
    return error500(res)
  }
}
