import {
  chainAsyncMiddlewareWithContext,
} from '../../../utils/middleware.js'

import {
  getPlatformView,
  getIntegratorView,
} from './cameras.js'

import {
  parseChipOptions,
  parseAlarmOptions,
} from './normalize_options.js'

import processFeatures from './features.js'

import {
  configureAlarmDetections,
  configureChipDetections,
} from './detections.js'

import checkCapabilities from './capabilities.js'

import { configureTampering } from './sceneChange/index.js'

import {
  parseAlarmImages,
  parseChipImages,
  parseUrlImages,
} from './images.js'

const statusMiddleware = async (ctx, req, res, next) => {
  // no matter the outcome, send JSON:API format
  res.type('application/vnd.api+json')
  await next()
}

const platformAlarmAnalysisMiddleware = chainAsyncMiddlewareWithContext(
  statusMiddleware,
  getPlatformView,
  parseAlarmOptions,
  processFeatures,
  configureAlarmDetections,
  checkCapabilities,
  parseAlarmImages,
  configureTampering, // Needs the images in case it's setting references.
)

const integratorAlarmAnalysisMiddleware = chainAsyncMiddlewareWithContext(
  statusMiddleware,
  getIntegratorView,
  parseAlarmOptions,
  processFeatures,
  configureAlarmDetections,
  checkCapabilities,
  parseAlarmImages,
  configureTampering, // Needs the images in case it's setting references.
)

const platformChipAnalysisMiddleware = chainAsyncMiddlewareWithContext(
  statusMiddleware,
  getPlatformView,
  parseChipOptions,
  processFeatures,
  configureChipDetections,
  checkCapabilities,
  parseChipImages,
)

const integratorChipAnalysisMiddleware = chainAsyncMiddlewareWithContext(
  statusMiddleware,
  getIntegratorView,
  parseChipOptions,
  processFeatures,
  configureChipDetections,
  checkCapabilities,
  parseChipImages,
)

const platformImageAnalysisMiddleware = chainAsyncMiddlewareWithContext(
  statusMiddleware,
  getPlatformView,
  parseAlarmOptions,
  processFeatures,
  configureAlarmDetections,
  checkCapabilities,
  parseUrlImages,
  configureTampering, // Needs the images in case it's setting references.
)

const integratorImageAnalysisMiddleware = chainAsyncMiddlewareWithContext(
  statusMiddleware,
  getIntegratorView,
  parseAlarmOptions,
  processFeatures,
  configureAlarmDetections,
  checkCapabilities,
  parseUrlImages,
  configureTampering, // Needs the images in case it's setting references.
)

export default {
  platform: {
    alarm: platformAlarmAnalysisMiddleware,
    chip: platformChipAnalysisMiddleware,
    analysis: platformImageAnalysisMiddleware,
  },
  integrator: {
    alarm: integratorAlarmAnalysisMiddleware,
    chip: integratorChipAnalysisMiddleware,
    analysis: integratorImageAnalysisMiddleware,
  },
}
