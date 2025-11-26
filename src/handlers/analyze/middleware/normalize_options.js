import {
  faceChipsEmbeddingsVersions,
} from '../../../constants/index.js'

import {
  error400,
} from '../../../common/error_response.js'

import { validateUrl } from '../../../common/validation.js'

import {
  getReferences,
} from '../../../utils/scene_change.js'

const validateReferenceUrl = (url) => {
  if (!validateUrl(url)) {
    throw new Error(
      `Reference image URL is not a valid URL: ${url}`,
    )
  }
  return { url }
}

const getFaceOptions = (options, defaultVersion) => {
  const {
    faceChipsEmbeddingsVersion: version = defaultVersion,
  } = options

  if (!faceChipsEmbeddingsVersions.allowed.includes(version)) {
    throw new Error(
      `Face embeddings version specified (${version}) is not an allowed value.`,
    )
  }

  return {
    embeddingsVersion: version,
  }
}

const normalizeAlarmOptions = (ctx, { options }) => {
  const {
    cameraData: {
      tamperingConfig,
    },
  } = ctx

  const faceAnalysis = getFaceOptions(
    options,
    faceChipsEmbeddingsVersions.defaults.fullFrame,
  )

  const sceneChange = {
    // Whether Services API should decide to perform scene change detection.
    force: options.performSceneChangeDetection !== undefined,
    perform: options.performSceneChangeDetection === true,
  }

  const refUrls = options.sceneChangeReferenceUrls || []

  if (!Array.isArray(refUrls)) {
    throw new TypeError('sceneChangeReferenceUrls must be an array')
  }

  sceneChange.referenceUrls = refUrls.map(validateReferenceUrl)

  // Check that if on-demand scene change is requested, that there are reference images.
  if (sceneChange.perform) {
    // Default to user-provided reference images.
    sceneChange.references = sceneChange.referenceUrls.length
      ? sceneChange.referenceUrls
      : getReferences(tamperingConfig)

    if (!sceneChange.references.length) {
      throw new Error('Scene change detection requested but no reference images were provided or configured.')
    }
  }

  // Add location and time to ctx.options, but they are not used anywhere else
  // at this time.
  return {
    sceneChange,
    location: options.location,
    detectionTime: options.detectionTime,
    faceAnalysis,
  }
}

const normalizeChipOptions = (ctx, { options }) => {
  const sceneChange = {
    force: true,
    perform: false,
  }

  const faceChips = getFaceOptions(
    options,
    faceChipsEmbeddingsVersions.defaults.chips,
  )

  // Client can select analysis type for views configured for more than one
  // analysis
  if (options.analysisType && Object.keys(options.analysisType).length === 0) {
    throw new Error('Analysis type object must contain one analysis type')
  }
  const analysisType = options.analysisType || {}
  if (Object.keys(analysisType).length > 1) {
    throw new Error('At most one analysis type may be specified in \'options\'')
  }

  // Add location and time to ctx.options, but they are not used anywhere else
  // at this time.
  return {
    sceneChange,
    faceChips,
    analysisType,
    location: options.location,
    detectionTime: options.detectionTime,
  }
}

const optionsMiddleware = (normalizer) => async (ctx, req, res, next) => {
  const {
    body: {
      options = {},
    },
    logger,
  } = req

  logger.info({ options }, 'Request input options:')

  try {
    ctx.options = normalizer(
      ctx,
      {
        options,
      },
    )
  }
  catch (err) {
    return error400(res, err.message)
  }

  await next()
}

export const parseChipOptions = optionsMiddleware(normalizeChipOptions)
export const parseAlarmOptions = optionsMiddleware(normalizeAlarmOptions)
