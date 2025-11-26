import sharp from 'sharp'
import { v4 as uuid } from 'uuid'

import { getView as retrieveCameraData } from '../../core/retrieve_camera_data.js'
import { updateView } from '../../core/create_or_update_camera.js'
import { uploadTamperingRef } from '../../common/s3.js'
import { getReferenceResponseUrl } from '../../utils/scene_change.js'
import {
  error400,
  error404,
  error500,
} from '../../common/error_response.js'

export default async function putReferenceImage(ctx, req, res) {
  const { companyId } = req
  const { userId } = req.auth
  const pathParams = ctx.request.path.split('/')

  // calipsa URL is one shorter than integrator style (5 vs. 6)
  const isCalipsa = pathParams.length === 5
  const cameraId = isCalipsa ? ctx.request.params.viewId : ctx.request.params.cameraIntegratorId
  const cameraIdType = isCalipsa ? 'calipsa' : 'integrator'

  // mode will be either 'dayReferenceImage' or 'nightReferenceImage'
  const mode = pathParams.at(-1)

  // Check the image parameters to make sure they conform
  let imageInfo
  const buffer = await req.body
  try {
    imageInfo = await sharp(buffer).metadata()
  }
  catch (err) {
    req.logger.error({
      cameraId,
      error: err,
    }, 'Image format error')
    return error400(res, `Image format error - ${err.message}`)
  }

  if (imageInfo.format !== 'jpeg' && imageInfo.format !== 'png') {
    req.logger.error({
      cameraId,
      imageInfo,
    }, 'Image format not supported')
    return error400(res, `Image type ${imageInfo.format} is not supported`)
  }

  // Fetch current view row for this camera and make sure it's there and correct
  let cameraData
  try {
    cameraData = await retrieveCameraData(
      userId,
      cameraId,
      cameraIdType,
      {
        // Integrations tend to set the day and night reference images
        // at almost the same time, so we need to make sure that the
        // up-to-date view is fetched from the master DB. Otherwise the
        // tampering config will be merged with the previous version,
        // which may not have the other (day/night) reference image set.
        // See CLSAPI-825
        intentToUpdate: true,
      },
    )
  }
  catch (err) {
    req.logger.error({
      userId,
      cameraId,
      error: err,
    }, 'Camera data fetch DB error')
    return error500(res)
  }
  if (!cameraData) {
    req.logger.error({ cameraId }, 'Camera not found')
    return error404(res, 'Camera not found')
  }
  // This shouldn't happen
  if (!cameraData.tampering) {
    req.logger.error({ cameraId }, 'Camera not configured for scene change detection')
    return error400(res, 'Camera must be configured for scene change detection before reference image updates are allowed')
  }

  // It appears that everything is properly configured, so check to see if
  // there is already a ref image for the requested mode and delete it if it's
  // present
  const imageMode = mode === 'dayReferenceImage' ? 'day' : 'night'
  const existingImageId = cameraData.tamperingConfig
    ? cameraData.tamperingConfig[imageMode]?.referenceImage
    : null

  // Everything is in order, so attempt the upload/update
  // If image exists, use same ID to overwrite it, otherwise generate new ID
  const imageId = existingImageId || uuid()
  const modeConfig = {
    referenceImage: imageId,
    referenceImageUpdatedAt: new Date(),
    isUpdatingReferenceImage: false,
  }

  // If this isn't an Elevate camera, tampering may be enabled without the
  // tamperingConfig object set. Setting it to "default" here.
  if (!cameraData.tamperingConfig) {
    cameraData.tamperingConfig = {
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
  cameraData.tamperingConfig[imageMode] = modeConfig

  // Attempt image upload
  try {
    const key = await uploadTamperingRef(imageId, {
      buffer,
      type: imageInfo.format,
    })
    req.logger.info({ key }, 'uploadTamperingRefKey')
  }
  catch (err) {
    req.logger.error({
      imageId,
      error: err,
    }, 'AWS image upload error')
    return error500(res)
  }

  try {
    await updateView(
      companyId,
      userId,
      cameraData.viewId,
      {
        viewName: cameraData.viewName,
        siteId: cameraData.siteId,
        masks: cameraData.masks,
        thermal: cameraData.thermal,
        status: cameraData.viewStatus,
        tampering: cameraData.tampering,
        tamperingConfig: cameraData.tamperingConfig,
        analytics: cameraData.analytics,
      },
    )
  }
  catch (err) {
    req.logger.error({
      cameraData,
      error: err,
    }, 'View update database error')
    return error500(res)
  }

  const refImageLocation = getReferenceResponseUrl(
    cameraData.viewId,
    { label: imageMode },
  )
  return res.status(204).location(refImageLocation.url).send()
}
