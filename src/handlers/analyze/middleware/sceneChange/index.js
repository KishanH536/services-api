import writeTamperingEvent from '../../../../core/create_tampering_event.js'

import {
  isNowDayTime,
  getReferences,
  sanitizeReference,
} from '../../../../utils/scene_change.js'

import {
  checkTampering,
} from './check/index.js'

import {
  setOnDemandSceneChange,
} from './on_demand.js'

import {
  setReferenceImage,
  maybeSaveMissingReference,
} from './references.js'

import {
  skipReferenceImage,
  noChecks,
} from './payloads.js'

export const configureTampering = async (ctx, req, _res, next) => {
  const {
    viewId,
    options: {
      sceneChange,
    },
    cameraData: {
      projectId,
      siteId,
      tamperingConfig,
    },
  } = ctx

  const {
    company: {
      id: companyId,
      tamperingConfig: companyTamperingConfig,
    },
    guid: uniqueRequestId,
  } = req

  ctx.tamperingFlags = {}

  if (sceneChange.force) {
    // Configure "on-demand" tampering detection.
    setOnDemandSceneChange(ctx)
  }
  else {
    const tamperingWithChecks = await checkTampering(ctx, companyTamperingConfig)

    if (tamperingWithChecks.withChecks.unable?.noReferenceImage) {
      // Special Case: If the reference image doesn't exist, set it and configure tampering for APS
      // such that tampering won't be performed and APS won't try to set the reference image.

      // Retain the original result for the final response.
      // This will be used in the alarm analysis handler.
      ctx.tamperingFlags.overrideReason = tamperingWithChecks.withChecks

      const isDayTime = isNowDayTime(ctx.cameraData.siteTimezone)
      // Set the reference image here instead of in APS if not using URLs.
      if (!ctx.hasImageUrls) {
        // Do we need to await these two functions?
        // I don't see a need to block alarm processing.
        await setReferenceImage(
          ctx.cameraData,
          ctx.imageBuffers.at(-1),
          isDayTime,
          req.logger,
        )
      }

      await writeTamperingEvent({
        id: uniqueRequestId,
        companyId,
        projectId,
        siteId,
        viewId,
        status: 'failed',
        processError: `Only 1 alarm received from camera which is used as ${isDayTime ? 'day' : 'night'} Reference image`,
      })

      // Skipping will not set the reference image in APS.
      // This is what we want because we set the reference image here instead.
      ctx.detections.tampering = skipReferenceImage()
    }
    else if (tamperingWithChecks.withChecks.proceed) {
      // Another Special Case: If proceeding with "with checks" tampering, convert to a
      // "no checks" scene change detection so that APS doesn't make any api-server requests.

      // Save the references in the "on-demand" scene change options
      // This will be used in the alarm analysis handler.
      sceneChange.references = getReferences(tamperingConfig)

      // Register the tampering event because APS doesn't register for 'noChecks' tampering.
      ctx.tamperingFlags.registerTampering = true

      // Override the tampering detection to be a "no checks" scene change detection
      ctx.detections.tampering = noChecks(sceneChange.references.map(sanitizeReference))

      // Finally, handle the case where a reference might be missing and set it.
      const isReferenceMissing = !sceneChange.references.length < 2

      // If URLs were passed, there is no ref image to save
      if (isReferenceMissing && !ctx.hasImageUrls) {
        // Do we need to await this function?
        // I don't see a need to block alarm processing.
        await maybeSaveMissingReference(
          ctx.cameraData,
          ctx.imageBuffers.at(-1),
          sceneChange.references,
          req.logger,
        )
      }
    }
    else {
      // No special cases - just set the tampering detection option.
      ctx.detections.tampering = tamperingWithChecks
    }
  }

  await next()
}
