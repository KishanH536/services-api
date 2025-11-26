import {
  getReferenceResponseUrl,
} from '../../utils/scene_change.js'

import writeTamperingEvent from '../../core/create_tampering_event.js'

export default async (ctx, req, analyzedTampering) => {
  const {
    sceneChange,
    viewId,
  } = ctx.options
  const { company, logger } = req
  const {
    id: tamperingEventId,
    isPerformed,
    isAttempted,
    isValid,
    reason,
    refIdx,
    isDay,
    isBlur: blur,
    isSceneChange: imageShift,
    error: tamperingError,
  } = analyzedTampering

  const sceneChangeResponse = {
    result: 'not_performed',
    reason: ctx.tamperingFlags.overrideReason || reason,
  }

  if (tamperingError) {
    logger.error({
      viewId,
      companyId: company.id,
      integratorId: company.createdByCompanyId,
      tamperingError,
    }, 'Tampering detection error')
    sceneChangeResponse.reason = {
      error: 'Unable to process detection, internal application error',
    }
  }

  // legacy check sets isPerformed, on-demand sets isAttempted
  else if (isPerformed || isAttempted) {
    if (isValid) {
      sceneChangeResponse.result = 'valid'
      sceneChangeResponse.details = {
        blur,
        imageShift,
      }
    }
    else {
      sceneChangeResponse.result = 'not_valid'
    }
    // eslint-disable-next-line unicorn/prefer-ternary
    if (isDay !== undefined) {
      /*
       * This is a legacy tampering check, which means that APS uses the
       * day/night paradigm. isDay will be returned and have a value.
       */
      sceneChangeResponse.reference = getReferenceResponseUrl(
        ctx.viewId,
        { label: isDay ? 'day' : 'night' },
      )
    }
    else {
      /*
       * This is the on-demand tampering check, which means that APS is passed
       * references in its options and the refIdx is returned of the one that is used.
       */
      sceneChangeResponse.reference = sceneChange.references && getReferenceResponseUrl(
        ctx.viewId,
        sceneChange.references[refIdx],
      )
    }

    if (ctx.tamperingFlags.registerTampering) {
      // Expect sceneChange.references to be set by tampering middleware if this flag is set.
      const {
        id: referenceId,
        label: referenceLabel,
        updatedAt: referenceUpdatedAt,
      } = sceneChange.references[refIdx]

      try {
        logger.info({
          viewId: ctx.viewId,
          tamperingEventId,
          referenceId,
        }, 'Saving tampering event to DB')

        // TODO: I don't think this needs to be awaited.
        // TODO: reorganize this with other post-processing steps to simplify the flow (CLSAPI-735)
        const tamperingEvent = await writeTamperingEvent({
          companyId: company.id,
          projectId: ctx.cameraData.projectId,
          siteId: ctx.cameraData.siteId,
          viewId: ctx.viewId,
          id: tamperingEventId,
          snapshotId: tamperingEventId,
          snapshotTime: new Date(),
          aiResult: isValid,
          referenceId,
          status: 'completed',
          isDayReference: referenceLabel === 'day',
          referenceUpdatedAt,
        })

        logger.info({
          tamperingEvent,
        }, 'Tampering event saved to DB')
      }
      catch (err) {
        // don't return a 500 in this case, just log the error
        logger.error(err, 'Failed to write tampering event')
      }
    }
  }

  return sceneChangeResponse
}
