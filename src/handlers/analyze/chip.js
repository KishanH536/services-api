import { isEmpty } from 'lodash-es'

import {
  totalAIFailures,
} from '../../common/prometheus.js'

import { ApsInvalidImagesError } from '../../common/errors/index.js'

import {
  processChip,
} from '../../core/process_platform_analysis.js'

import {
  error400,
  error500,
} from '../../common/error_response.js'

import {
  getChipAnalyticsResponse,
} from './getResponseBody.js'

import putAnalysis from './put_analysis.js'

import { getOptionsFromContext } from './aps.js'

/**
 * @param {object} ctx
 * @param {object} req
 * @param {object} res
 */
export default async (ctx, req, res) => {
  const {
    company,
    logger,
    guid: uniqueRequestId,
  } = req

  const {
    imageBuffers: images,
    imageUrls,
  } = ctx

  // bypass APPS call, as all customers using chips are MCAP customers.
  // https://jira.mot-solutions.com/browse/CLSAPI-705
  const {
    options: apsOptions,
  } = getOptionsFromContext(ctx, company, logger)

  // Analyse the alarm with APS
  try {
    const {
      valid: analyzedValidity,
      analytics,
    } = await processChip({
      options: apsOptions,
      images,
      imageUrls,
      uniqueRequestId,
      logger: req.logger,
    })

    logger.info({
      analyzedValidity,
    }, 'APS request successful')

    // Create skeleton for response
    const responseBody = {
      data: {
        id: uniqueRequestId,
        type: 'alarm-analysis',
        attributes: {
          analytics: {},
        },
      },
    }
    // Add analytics for any alarm that isn't "tampering-only"
    if (!isEmpty(analytics)) {
      responseBody.data.attributes.analytics = {
        resultSummary: analyzedValidity ? 'valid' : 'not_valid', // valid or not valid
        ...getChipAnalyticsResponse(analytics, ctx),
      }
    }

    // Write this analysis so that it can be annotated later
    // TODO: reorganize this with other post-processing steps to simplify the flow (CLSAPI-735)
    putAnalysis(ctx, req, responseBody)

    return res.status(200).json(responseBody)
  }
  catch (err) {
    totalAIFailures.inc(1)
    logger.error(err, 'APS request failed')

    if (err instanceof ApsInvalidImagesError) {
      return error400(res, err.message)
    }

    return error500(res)
  }
}
