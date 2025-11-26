import processViaMl from '../../core/process_via_ml.js'
import { checkDetectionCapabilities } from '../../utils/check_capabilities.js'
import {
  error403,
  error400,
  error500,
} from '../../common/error_response.js'

export default async function convertEmbeddings(ctx, req, res) {
  const uniqueRequestId = req.guid

  const {
    company,
    integratorCompany,
  } = req

  const {
    embeddings,
    options: {
      version: {
        supplied: suppliedVersion,
        requested: requestedVersion,
      },
    },
  } = ctx.request.body

  const faceDetection = {
    face: {
      chips: true,
    },
  }

  if (suppliedVersion === requestedVersion) {
    const message = 'Requested and supplied embeddings versions must differ.'
    req.logger.error({
      suppliedVersion,
      requestedVersion,
    }, message)
    return error400(res, message)
  }

  const companyId = integratorCompany?.id || company.id
  const {
    valid,
    missingCapabilities,
  } = await checkDetectionCapabilities(companyId, faceDetection)

  if (!valid) {
    req.logger.error({
      companyId,
      missingCapabilities,
    }, 'Capabilities check failed')
    return error403(res)
  }

  // This may get more complicated
  const path = suppliedVersion === 5 ? 'convert_v5_embeddings_to_v6' : 'convert_v6_embeddings_to_v5'

  try {
    const conversionResult = await processViaMl(
      req.logger,
      embeddings,
      uniqueRequestId,
      path,
    )

    const responseBody = {
      data: {
        id: uniqueRequestId,
        type: 'embeddings',
        attributes: {
          version: requestedVersion,
          embeddings: conversionResult,
        },
      },
    }
    req.logger.info('ML request success')
    res.status(200)
    return res.json(responseBody)
  }
  catch (err) {
    req.logger.error(err, 'ML request failed')
    return error500(res)
  }
}
