import { isEmpty } from 'lodash-es'

import {
  totalAIFailures,
} from '../../common/prometheus.js'
import { ApsInvalidImagesError } from '../../common/errors/index.js'

import {
  processAnalysis,
} from '../../core/process_platform_analysis.js'

import {
  error500,
  error400,
} from '../../common/error_response.js'

import putAnalysis from './put_analysis.js'
import { getOptionsFromContext } from './aps.js'
import saveSnapshot from './snapshots.js'

import processTampering from './process_tampering.js'
import {
  getAnalyticsResponse,
} from './getResponseBody.js'

/**
 * @param {object} ctx
 * @param {object} req
 * @param {object} res
 */
export default async (ctx, req, res) => {
  const uniqueRequestId = req.guid
  const { company, logger } = req
  const { imageUrls } = ctx

  // The only customers that will be using URLs for images will be MCAP
  // customers, so we can get the advice directly from the context.
  const {
    options: apsOptions,
  } = getOptionsFromContext(ctx, company, logger)

  try {
    const {
      valid: analyzedValidity,
      tampering: analyzedTampering,
      analytics,
    } = await processAnalysis({
      options: apsOptions,
      imageUrls,
      uniqueRequestId,
      logger,
    })

    logger.info({
      analyzedValidity,
    }, 'APS request successful')
    logger.info({ analyzedTampering }, 'APS analyzedTampering')

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
        ...getAnalyticsResponse(analytics, ctx),
      }
    }

    // Add scene change (i.e., tampering) if it's provided
    if (analyzedTampering) {
      const processedTampering = await processTampering(ctx, req, analyzedTampering)
      responseBody.data.attributes.sceneChange = processedTampering
    }

    // Save the snapshot if requested.
    if (ctx.cameraData.snapshotSet) {
      // I don't think we need to await this.
      // TODO: reorganize this with other post-processing steps to simplify the flow (CLSAPI-735)
      saveSnapshot(ctx, req)
    }

    res.status(200)

    // Write this analysis so that it can be annotated later
    // TODO: reorganize this with other post-processing steps to simplify the flow (CLSAPI-735)
    putAnalysis(ctx, req, responseBody)

    return res.json(responseBody)
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
