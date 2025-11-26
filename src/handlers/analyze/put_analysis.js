import { cloneDeep } from 'lodash-es'

import { services } from '../../services/index.js'
import { removeFaceEmbeddings } from '../../utils/embeddings.js'

export default async (ctx, req, responseBody) => {
  const {
    company,
    logger,
  } = req

  const {
    cameraData: {
      viewId,
      siteId,
      masks,
    },
    features,
  } = ctx

  const viewConfig = {
    masks,
    features,
  }

  if (company.alarmRetentionDays === 0) {
    logger.info({ company }, 'Skipping storing analysis result')
    return
  }

  const { Dynamo: dynamoService } = services

  const analysisResult = cloneDeep(responseBody)

  const {
    data: {
      id: analysisId,
      attributes: {
        analytics: {
          faceDetection,
        },
      },
    },
  } = analysisResult

  // Clear embeddings for face detection
  if (faceDetection) {
    faceDetection.faces = removeFaceEmbeddings(faceDetection.faces || [])
  }

  // expireAt is Unix epoch time format in seconds
  const retentionSeconds = company.alarmRetentionDays * 24 * 60 * 60
  const expireAt = Math.floor(Date.now() / 1000) + retentionSeconds

  await dynamoService.putAnalysisResult({
    companyId: company.id,
    analysisId,
    analysisResult,
    expireAt,
    viewId,
    siteId,
    viewConfig,
  })

  logger.info({ analysisId }, 'Stored analysis result')
}
