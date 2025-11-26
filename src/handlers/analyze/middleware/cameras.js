import {
  error404,
  error410,
  error500,
} from '../../../common/error_response.js'

import { getView } from '../../../core/retrieve_camera_data.js'
import getDeletedCameras from '../../../core/retrieve_deleted_cameras.js'

const getViewById = async (userId, ctx) =>
  await getView(
    userId,
    ctx.request.params.viewId,
    'calipsa',
  )

const getViewByIntegratorId = async (userId, ctx) =>
  await getView(
    userId,
    ctx.request.params.cameraIntegratorId,
    'motorola',
  )

const getDeletedViewById = async (ctx) =>
  await getDeletedCameras(
    null,
    ctx.request.params.viewId,
  )

const getDeletedViewByIntegratorId = async (ctx) =>
  await getDeletedCameras(
    ctx.request.params.cameraIntegratorId,
    null,
  )

const getViewMiddleware = (viewGetter, deletedViewGetter) =>
  async (ctx, req, res, next) => {
    const { userId } = req.auth

    let cameraData
    try {
      cameraData = await viewGetter(userId, ctx)

      if (!cameraData) {
        if (await deletedViewGetter(ctx)) {
          req.logger.error('Camera has been deleted')
          return error410(res, 'Camera has been deleted')
        }
        req.logger.error('Camera not found')
        return error404(res, 'Camera not found')
      }
    }
    catch (err) {
      req.logger.error({
        error: err,
      }, 'Error getting view.')
      return error500(res, 'Internal server error')
    }

    ctx.cameraData = cameraData
    ctx.viewId = cameraData.viewId

    await next()
  }

export const getPlatformView = getViewMiddleware(
  getViewById,
  getDeletedViewById,
)

export const getIntegratorView = getViewMiddleware(
  getViewByIntegratorId,
  getDeletedViewByIntegratorId,
)
