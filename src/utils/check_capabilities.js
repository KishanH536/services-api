import { services } from '../services/index.js'

const namedDetectionsCapabilityMap = {
  person: 'PERSON_ANALYTICS',
  vehicle: 'VEHICLE_ANALYTICS',
  lpr: 'VEHICLE_ANALYTICS',
  tampering: 'DETECT_SCENE_CHANGE',
  face: 'DETECT_FACE',
  classification: 'SCENE_CLASSIFICATION',
  securityRisks: 'MULTIPLE_RISK_ANALYSIS',
  environmentalHazards: 'MULTIPLE_RISK_ANALYSIS',
}

const namedFeaturesCapabilityMap = {
  forensic: 'FORENSIC_SEARCH',
  vehicleAnalysis: 'VEHICLE_ANALYTICS',
  personAnalysis: 'PERSON_ANALYTICS',
  sceneChangeDetection: 'DETECT_SCENE_CHANGE',
  sceneClassification: 'SCENE_CLASSIFICATION',
  multipleRiskAnalysis: 'MULTIPLE_RISK_ANALYSIS',
}

const mapAdvancedRules = (advancedRules) => {
  if (!advancedRules?.length) {
    return []
  }

  return advancedRules.reduce((acc, rule) => {
    if (rule.faceDetection) {
      acc.push('DETECT_FACE')
    }

    // More checks here (example gun detection, when we start enforcing)
    return acc
  }, [])
}

const mapNamed = capabilityMap => obj => Object
  .keys(obj)
  .map(key => capabilityMap[key])
  .filter(Boolean)

const mapNamedDetections = mapNamed(namedDetectionsCapabilityMap)
const mapNamedFeatures = mapNamed(namedFeaturesCapabilityMap)

const checkCapabilities = async (companyId, capabilityNames) => {
  // If no checkable capabilities are present, then no checks are needed
  if (!capabilityNames.length) {
    return { valid: true }
  }
  const { Capabilities: capabilitiesService } = services
  return await capabilitiesService.checkCapabilities(companyId, capabilityNames)
}

export const checkDetectionCapabilities = async (companyId, detections) => {
  const advancedCapabilities = mapAdvancedRules(detections.advanced?.rules)
  const otherCapabilities = mapNamedDetections(detections)

  const capabilityNames = [
    ...advancedCapabilities,
    ...otherCapabilities,
  ]

  return checkCapabilities(companyId, capabilityNames)
}

/**
 * Checks a features against the capabilities of a company.
 * @param {*} companyId
 * @param {*} features
 * @returns {Promise<{
 *   valid: Boolean,
 *   missingCapabilities: Array
 * }>}
 */
export const checkFeatureCapabilities = async (companyId, features) => {
  if (!features) {
    return { valid: true }
  }

  const advancedCapabilities = mapAdvancedRules(features?.advancedRules)
  const otherCapabilities = mapNamedFeatures(features)

  const capabilityNames = [
    ...advancedCapabilities,
    ...otherCapabilities,
  ]

  return checkCapabilities(companyId, capabilityNames)
}
