import { services } from '../../services/index.js'

import {
  filterObjectValues,
} from '../../utils/generic.js'

import {
  error400,
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

  const {
    request: {
      path,
      query: {
        startTime,
        endTime,
        viewId,
        siteId,
      },
    },
  } = ctx

  const {
    Dynamo: dynamo,
  } = services

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  // Need to manually validate time range order
  // `endTime` and `startTime` are required in openapi spec,
  // so they will always be present
  if (endTime < startTime) {
    return error400(
      res,
      'endTime must be greater than or equal to startTime',
    )
  }

  try {
    // Get analysis result from DynamoDB:
    const {
      analyses,
      nextTimestamp,
    } = await dynamo.getAnalysisResults(
      companyId,
      {
        startTime,
        endTime,
        viewId,
        siteId,
      },
    )

    if (!analyses) {
      return error404(res)
    }

    let links

    if (nextTimestamp) {
      const params = {
        startTime: nextTimestamp,
        endTime,
        viewId,
        siteId,
      }

      const filter = filterObjectValues(Boolean)
      const query = new URLSearchParams(
        filter(params),
      )

      links = {
        next: `${path}?${query.toString()}`,
        prev: null,
      }
    }

    return res.json({
      data: analyses.map(analysis => {
        const {
          analysisId: id,
          ...rest
        } = analysis

        return {
          type: 'analysis-result',
          id,
          attributes: {
            ...rest,
          },
        }
      }),
      links,
    })
  }
  catch (err) {
    logger.error(err, 'Error getting analyses')
    return error500(res)
  }
}
