import { getView as retrieveCameraData } from '../../core/retrieve_camera_data.js'
import {
  getSnapshotUrl,
  getTamperingRefUrl,
} from '../../common/s3.js'

import {
  error404,
  error500,
} from '../../common/error_response.js'

async function getSnapshotCalipsa(ctx, req, res) {
  const { userId } = req.auth
  const { viewId } = ctx.request.params
  const refImage = ctx.request.query?.refImage
  const getDayRef = refImage === 'day'
  const getNightRef = refImage === 'night'

  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')

  let dayRefId
  let nightRefId

  try {
    const camera = await retrieveCameraData(userId, viewId, 'calipsa')

    if (!camera) {
      return error404(res, 'The specified view could not be found')
    }

    dayRefId = camera.tamperingConfig?.day?.referenceImage
    nightRefId = camera.tamperingConfig?.night?.referenceImage

    if (getDayRef && !dayRefId || getNightRef && !nightRefId) {
      return error404(res, 'Requested refernce image does not exist')
    }
  }
  catch (err) {
    req.logger.error({
      userId,
      viewId,
      error: err,
    }, 'Error in retrieving view for snapshot')
    return error500(res)
  }

  const getImageUrlFunction = getDayRef || getNightRef ? getTamperingRefUrl : getSnapshotUrl
  let getImageUrlParam
  if (getDayRef) {
    getImageUrlParam = dayRefId
  }
  else if (getNightRef) {
    getImageUrlParam = nightRefId
  }
  else {
    getImageUrlParam = viewId
  }

  try {
    const imageUrl = await getImageUrlFunction(getImageUrlParam)
    req.logger.info({ imageUrl }, 'Created S3 image URL')
    res.location(imageUrl)
    res.append('Cache-Control', 'max-age=3600') // 1 hour matches pre-signed URL time
    res.sendStatus(301)
  }
  catch (err) {
    req.logger.error({
      viewId,
      error: err,
    }, 'Error in sending redirect response for snapshot')
    return error500(res)
  }
}

export default getSnapshotCalipsa
