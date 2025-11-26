import {
  transformFromFeatureRules,
} from '../../../common/view_features.js'

import {
  error400,
} from '../../../common/error_response.js'

// These detection types are not really advanced rules,
// so need to be removed from the advanced rules detections.
const nonAlarmDetections = [
  'faceDetection',
  'gunDetection',
]

export const configureAlarmDetections = async (ctx, req, _res, next) => {
  const {
    features,
    options: {
      faceAnalysis: {
        embeddingsVersion,
      },
    },
  } = ctx

  const {
    logger,
  } = req

  const detections = {}

  // Object detection and advanced rules are mutually exclusive
  if (features.advancedRules?.length) {
    // `features.advancedRules` has already been resolved from
    // either `view.status` or advanced rules table.
    const allAdvancedRules = transformFromFeatureRules(features.advancedRules)

    // check for alarm-style rules, since this is for the full-frame '/analysis' endpoint.
    const advancedRules = allAdvancedRules.filter(rule =>
      !Object.keys(rule).some(key => nonAlarmDetections.includes(key)))

    if (advancedRules.length > 0) {
      logger.warn(
        {
          features,
          advancedRules,
        },
        'Legacy advanced rules present in view configuration for full-frame analysis. These will be ignored.',
      )
    }

    // Get the face detection rule from the advanced rules, if it exists.
    // It would be nice if this was an analysis-type feature instead of an advanced rule.
    const faceDetectionRule = allAdvancedRules.some(rule => rule.faceDetection)

    if (faceDetectionRule) {
      detections.face = {
        chips: false,
        embeddings: 'v'.concat(embeddingsVersion),
      }
    }
  }
  else if (features.objectDetection) {
    logger.warn(
      {
        features,
      },
      'Legacy object detection present in view configuration for full-frame analysis. These will be ignored.',
    )
  }

  // Analysis-type features are additive.
  if (features.vehicleAnalysis) {
    detections.vehicle = { chips: false }
  }
  if (features.personAnalysis) {
    detections.person = { chips: false }
  }
  if (features.sceneClassification) {
    detections.classification = {}
  }
  if (features.multipleRiskAnalysis) {
    detections.securityRisks = {}
    detections.environmentalHazards = {}
  }

  ctx.detections = detections

  await next()
}

const selectDetectionTypeByAnalysisOption = (chipType, analysisOption) => {
  if (!analysisOption) {
    return chipType
  }
  if (analysisOption === chipType) {
    return analysisOption
  }
  if (analysisOption === 'lpr' && chipType === 'vehicle') {
    return analysisOption
  }
  if (analysisOption === 'vehicle' && chipType === 'lpr') {
    return analysisOption
  }
  return null
}

// This functtion applies the APS chip processing priority, and only selects
// the highest priority detection in the detections list.
//  The priority in APS is, from highest to lowest:
//
//    1. 'gun'
//    2. 'face'
//    3. 'person'
//    4. 'lpr'
//    5. 'vehicle'
//
// If analysisOption is set, then the detections array will only contain a
// single value, and this selection will be superfluous.
const selectDetectionTypeByPriority = (detections) => {
  const detectionsKeys = Object.keys(detections)
  if (detectionsKeys.includes('gun')) {
    return { gun: detections.gun }
  }
  if (detectionsKeys.includes('face')) {
    return { face: detections.face }
  }
  if (detectionsKeys.includes('person')) {
    return { person: detections.person }
  }
  if (detectionsKeys.includes('lpr')) {
    return { lpr: detections.lpr }
  }
  if (detectionsKeys.includes('vehicle')) {
    return { vehicle: detections.vehicle }
  }
  // If none of the types match, return an empty object so the check for no
  // detections will not crash.
  return {}
}

export const configureChipDetections = async (ctx, _req, res, next) => {
  const {
    features,
    options: {
      faceChips: {
        embeddingsVersion,
      },
      analysisType: optionsAnalysisType,
    },
  } = ctx

  // Validate for chip-type detection features
  // TODO - add validations for actual chip-style advanced rules
  // (regular advanced rules will cause APS to return an error)
  if (!(features.advancedRules?.length || features.vehicleAnalysis || features.personAnalysis)) {
    return error400(res, 'Invalid feature configuration for chip processing.')
  }

  // See if there's an analysis option selected by the client and set the
  // analysisOption variable to reflect this selection
  let analysisOption
  // There should only be 0 or 1 attributes in optionsAnalysisType due to
  // earlier error checking
  const analysisType = Object.keys(optionsAnalysisType)[0]
  switch (analysisType) {
    case 'faceDetection':
      analysisOption = 'face'
      break
    case 'gunDetection':
      analysisOption = 'gun'
      break
    case 'personAnalysis':
      analysisOption = 'person'
      break
    case 'vehicleAnalysis':
      analysisOption = optionsAnalysisType.vehicleAnalysis.chipsType === 'vehicles' ? 'vehicle' : 'lpr'
      break
    default:
      break
  }

  // Get the types of chip detections configured based of features. If no
  // analysisOption is set, then these chipTypes will be sent as APS detections
  let chipTypes = []
  if (features?.advancedRules) {
    chipTypes = features.advancedRules
      .filter(rule => rule.faceDetection || rule.gunDetection)
      .map(rule => rule.faceDetection ? 'face' : 'gun')
  }
  // Default to license plate detection if chipsType not set
  if (features?.vehicleAnalysis) {
    const vehicleChipsType = features.vehicleAnalysis.chipsType === 'vehicles' ? 'vehicle' : 'lpr'
    chipTypes.push(vehicleChipsType)
  }

  if (features?.personAnalysis) {
    chipTypes.push('person')
  }

  // Transform chip types to chip name/value pairs in detections object. Check
  // that there is a match if the analysis option was set by the client.
  // We do a special case for face chips, where we add the embeddings attribute.
  const detections = chipTypes.reduce((acc, chipType) => {
    const detectionType = selectDetectionTypeByAnalysisOption(chipType, analysisOption)
    if (detectionType) {
      acc[detectionType] = { chips: true }
      if (detectionType === 'face') {
        // APS is setup to take "v5" or "v6", although we could change that
        acc[detectionType].embeddings = 'v'.concat(embeddingsVersion)
      }
    }
    return acc
  }, {})

  // Now that we have the list of all detections, we'll apply the APS priority
  // for chips and select just a single detection to send to APS.
  ctx.detections = selectDetectionTypeByPriority(detections)

  if (!Object.keys(ctx.detections).length) {
    return error400(res, `Specified analysis type option (${Object.keys(optionsAnalysisType)}) not configured for view`)
  }

  await next()
}
