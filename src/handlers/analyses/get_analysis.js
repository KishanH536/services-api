import { services } from '../../services/index.js'

import {
  error404,
  error500,
} from '../../common/error_response.js'

import {
  getOriginalImagesUrl,
} from '../../common/s3.js'

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

  const {
    Dynamo: dynamo,
  } = services

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  try {
    // Get analysis result from DynamoDB:
    const analysis = await dynamo.getAnalysisResult(
      companyId,
      analysisId,
    )

    if (!analysis) {
      return error404(res)
    }

    const originalImagesUrl = await getOriginalImagesUrl(analysisId)

    // Don't need the analysisId in the response attributes
    const {
      analysisId: returnedAnalysisId, // Should be the same as the request analysis ID.
      ...attributes
    } = analysis

    return res.json({
      data: {
        id: returnedAnalysisId,
        type: 'analysis-result',
        attributes: {
          originalImagesUrl,
          ...attributes,
        },
      },
    })
  }
  catch (err) {
    logger.error(err, 'Error getting analyses')
    return error500(res)
  }
}
