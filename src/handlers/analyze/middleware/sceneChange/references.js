import { v4 as uuid } from 'uuid'

import { updateView } from '../../../../core/create_or_update_camera.js'
import { uploadTamperingRef } from '../../../../common/s3.js'

import {
  isNowDayTime,
} from '../../../../utils/scene_change.js'

export const setReferenceImage = async (
  cameraData,
  image,
  isDayTime,
  log,
) => {
  const imageMode = isDayTime ? 'day' : 'night'

  // Use existing reference ID if it exists.
  const referenceId = cameraData.tamperingConfig?.[imageMode]?.referenceImage || uuid()

  // Upload reference image to S3.
  try {
    const key = await uploadTamperingRef(referenceId, {
      buffer: image,
      type: 'jpeg',
    })

    log.info({
      key,
      imageMode,
    }, 'uploaded tampering reference image')
  }
  catch (err) {
    log.error(err, 'failed to upload tampering reference image')
  }

  // Update view in DB with new reference image info.
  let newTamperingConfig = cameraData.tamperingConfig

  // Default tampering config if it doesn't already exist.
  if (!newTamperingConfig) {
    newTamperingConfig = {
      day: {
        referenceImage: null,
        referenceImageUpdatedAt: null,
        isUpdatingReferenceImage: false,
      },
      night: {
        referenceImage: null,
        referenceImageUpdatedAt: null,
        isUpdatingReferenceImage: false,
      },
    }
  }
  newTamperingConfig[imageMode] = {
    referenceImage: referenceId,
    referenceImageUpdatedAt: new Date(),
    isUpdatingReferenceImage: false,
  }

  try {
    await updateView(
      cameraData.companyId,
      cameraData.userId,
      cameraData.viewId,
      {
        viewName: cameraData.viewName,
        siteId: cameraData.siteId,
        masks: cameraData.masks,
        thermal: cameraData.thermal,
        status: cameraData.viewStatus,
        tampering: cameraData.tampering,
        tamperingConfig: newTamperingConfig,
        analytics: cameraData.analytics,
      },
    )
  }
  catch (err) {
    log.error(err, 'failed to update view with new tampering reference information')
  }
}

// Only called when at least one reference is missing.
export const maybeSaveMissingReference = async (
  cameraData,
  snapshot,
  references,
  log,
) => {
  const isDayAvailable = references.some(({ label }) => label === 'day')

  const isDayTime = isNowDayTime(cameraData.siteTimezone)

  // day is available AND is day time => don't save
  // day is not available AND is day time => save
  // day is available AND is not day time => save (because night is not available)
  // day is not available and is not day time => don't saves
  const shouldSave = isDayAvailable ^ isDayTime

  if (shouldSave) {
    await setReferenceImage(
      cameraData,
      snapshot,
      isDayTime,
      log,
    )
  }
}
