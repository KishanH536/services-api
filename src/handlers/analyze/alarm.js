import { isEmpty } from 'lodash-es'

import {
  totalAIFailures,
} from '../../common/prometheus.js'
import { ApsInvalidImagesError } from '../../common/errors/index.js'

import processAlarm from '../../core/process_alarm.js'

import {
  error500,
  error400,
} from '../../common/error_response.js'

import putAnalysis from './put_analysis.js'
import { getOptionsFromContext } from './aps.js'
import {
  getAnalyticsResponse,
} from './getResponseBody.js'
import saveSnapshot from './snapshots.js'

import processTampering from './process_tampering.js'

/**
 * @param {object} ctx
 * @param {object} req
 * @param {object} res
 */
export default async (ctx, req, res) => {
  const uniqueRequestId = req.guid
  const { company, logger } = req

  const {
    imageBuffers: images,
  } = ctx

  // get alarm options for APS
  const {
    options: apsOptions,
  } = getOptionsFromContext(
    ctx,
    company,
    logger,
  )

  try {
    const {
      valid: analyzedValidity,
      alarmType,
      tampering: analyzedTampering,
      analytics,
    } = await processAlarm({
      options: apsOptions,
      images,
      uniqueRequestId,
      company,
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
    if (alarmType !== 'tampering-only' && !isEmpty(analytics)) {
      responseBody.data.attributes.analytics = {
        resultSummary: analyzedValidity ? 'valid' : 'not_valid', // valid or not valid
        ...getAnalyticsResponse(analytics, ctx, alarmType),
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
