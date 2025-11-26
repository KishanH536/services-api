import {
  sanitizeReference,
} from '../../../../utils/scene_change.js'

import {
  skip,
  viewIsNotEligible,
  noChecks,
} from './payloads.js'

export const setOnDemandSceneChange = async (ctx) => {
  const {
    viewId,
    features,
    options: {
      sceneChange,
    },
    detections: {
      tampering,
    },
  } = ctx

  // Capabilities Check:
  // `ctx.detections.tampering` shouldn't be set unless the capabilities
  // check fails, in which case it will already be set to the "notEligible"
  // payload. In that case, don't process on-demand tampering and keep the
  // existing payload.
  if (tampering?.withChecks?.notEligible) {
    return
  }

  let tamperingDetections

  // options.sceneChange.forced is true.
  if (!sceneChange.perform) {
    tamperingDetections = skip()
  }
  else if (!features.sceneChangeDetection) {
    tamperingDetections = viewIsNotEligible(viewId)
  }
  else {
    tamperingDetections = noChecks(sceneChange.references.map(sanitizeReference))
  }

  ctx.detections.tampering = tamperingDetections
}
