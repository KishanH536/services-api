import {
  DEFAULT_TZ as defaultTimeZone,
} from '../../../../../../config/misc.js'

import {
  hasReferenceImage,
} from '../../../../../utils/scene_change.js'

import {
  notEligibleForTampering,
  noReferences,
  skipPeriodDetection,
  proceed,
} from '../payloads.js'

import {
  isTamperingAlreadyDone,
} from './detections.js'

// Check tampering and return the tampering payload.
export const checkTampering = async (ctx, companyTamperingConfig) => {
  const {
    features,
    cameraData: {
      viewId,
      tamperingConfig,
      siteTimezone,
    },
  } = ctx

  if (!features.sceneChangeDetection) {
    return notEligibleForTampering(viewId)
  }

  if (!hasReferenceImage(tamperingConfig)) {
    return noReferences()
  }

  if (await isTamperingAlreadyDone(
    viewId,
    companyTamperingConfig,
    siteTimezone || defaultTimeZone,
    new Date(),
  )) {
    return skipPeriodDetection()
  }

  // All checks passed, proceed with tampering detection.
  return proceed(tamperingConfig, siteTimezone)
}
