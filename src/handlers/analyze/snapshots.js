import { uploadSnapshot } from '../../common/s3.js'
import { updateView } from '../../core/create_or_update_camera.js'

// Save a snapshot to S3 and update the view in the database.
const saveSnapshot = async (ctx, req) => {
  const {
    viewId,
    cameraData: {
      viewName,
      masks,
      thermal,
      siteId,
      viewStatus,
      tampering,
      analytics,
    },
    imageBuffers,
  } = ctx

  const {
    companyId,
    auth: {
      userId,
    },
    logger,
  } = req

  // From APS:
  // select the second image if there's more than one, otherwise
  // select the first. This is because sometimes the first image
  // is a grey image that doesn't represent the scene. See
  // https://jira.mot-solutions.com/browse/CLSCA-5881 for more
  // context.
  const buffer = imageBuffers.length > 1 ? imageBuffers[1] : imageBuffers[0]

  try {
    const upload = uploadSnapshot(viewId, buffer)

    const update = updateView(
      companyId,
      userId,
      viewId,
      {
        viewName,
        masks,
        thermal,
        siteId,
        tampering,
        analytics,
        status: viewStatus,
        snapshot: false,
      },
    )

    await Promise.all([upload, update])
  }
  catch (err) {
    logger.error(err, 'Failed to save snapshot')
  }
}

export default saveSnapshot
