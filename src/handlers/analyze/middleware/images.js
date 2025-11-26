import sampleImages from '../../../core/get_sampled_images.js'
import {
  getMetadata,
} from '../../../common/image_processing.js'

import {
  error400,
} from '../../../common/error_response.js'

// Get metadata for all images.
const getImagesMetadata = async (buffers) => await Promise.all(buffers.map(getMetadata))

const getImageBuffers = (req, imageFieldName) => {
  if (!(req.files && req.files[imageFieldName]?.length)) {
    return
  }

  const buffers = req.files[imageFieldName].map(file => file.buffer)
  return sampleImages(buffers, 6)
}

export const parseChipImages = async (ctx, req, res, next) => {
  // For form-data, pull out the images and check their sizes before proceeeding
  if (req.is('multipart/form-data')) {
    const imageBuffers = getImageBuffers(req, 'chipImages')
    if (!imageBuffers) {
      return error400(res, 'No images or URLs were provided')
    }

    // Check sizes for chips with restrictions
    const metadata = await getImagesMetadata(imageBuffers)

    const invalidChipFormat = metadata.filter(m => m.format !== 'jpeg')
    if (invalidChipFormat.length > 0) {
      return error400(res, 'All chip images must be JPEG format.')
    }

    if (ctx.detections.vehicle) {
      const invalidVehicleImages = metadata.filter(m => m.width < 150 || m.height < 150)
      if (invalidVehicleImages.length > 0) {
        return error400(res, 'All chips for vehicle processing must be at least 150x150.')
      }
    }
    if (ctx.detections.gun) {
      const invalidGunImages = metadata.filter(m => m.width < 35 || m.height < 35)
      if (invalidGunImages.length > 0) {
        return error400(res, 'All chips for gun processing must be at least 35x35 (WxH).')
      }
    }
    if (ctx.detections.person) {
      const invalidPersonImages = metadata.filter(m => m.width < 40 || m.height < 100)
      if (invalidPersonImages.length > 0) {
        return error400(res, 'All chips for person processing must be at least 40x100 (WxH).')
      }
    }

    ctx.imageBuffers = imageBuffers
  }

  // If it's not form-data, it must be application/json, as that is all the spec
  // allows. For URLs, simply check that there are URLs present
  else {
    const imageUrls = req.body?.chipUrls

    if (!imageUrls) {
      return error400(res, 'Chip image URLs (chipUrls) must be provided in request.')
    }

    ctx.hasImageUrls = true
    ctx.imageUrls = imageUrls
  }

  await next()
}

export const parseAlarmImages = async (ctx, req, res, next) => {
  const imageBuffers = getImageBuffers(req, 'alarmImages')

  if (!imageBuffers) {
    return error400(res, 'No images were provided')
  }

  const metadata = await getImagesMetadata(imageBuffers)
  const invalidImages = metadata.filter(m => m.width < 320 || m.height < 240)
  if (invalidImages.length > 0) {
    return error400(res, 'All images must be at least 320x240.')
  }

  ctx.imageBuffers = imageBuffers
  await next()
}

export const parseUrlImages = async (ctx, req, res, next) => {
  const imageUrls = req.body?.analysisImageUrls

  if (!imageUrls) {
    return error400(res, 'Image URLs (analysisImageUrls) must be provided in request.')
  }

  ctx.hasImageUrls = true
  ctx.imageUrls = imageUrls
  await next()
}
