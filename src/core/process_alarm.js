import {
  processAnalysis as processPlatformAnalysis,
} from './process_platform_analysis.js'

const analysisDetectionTypes = [
  'face',
  'vehicle',
  'person',
  'classification',
  'securityRisks',
  'environmentalHazards',
]

// Determing which handler to use based on the detection present in the options.
// First priority is the analysis detections, if any exist.
// Next priority is the alarm detections, if any exist.
// Finally, fallback to the analysis handler.
const getPlatformHandler = ({ detections }, logger) => {
  const detectionTypes = Object.keys(detections)

  // First priority: analysis detections
  if (!detectionTypes.some(type => analysisDetectionTypes.includes(type))) {
    logger.warn('No analysis-type detections present in options.')
  }

  return processPlatformAnalysis
}

export default ({
  options,
  images,
  uniqueRequestId,
  logger,
}) => {
  // Get the appropriate handler based on the detections in the options.
  const handler = getPlatformHandler(options, logger)

  return handler({
    options,
    images,
    uniqueRequestId,
    logger,
  })
}
