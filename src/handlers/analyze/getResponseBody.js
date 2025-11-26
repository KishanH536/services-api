import { isEmpty } from 'lodash-es'

import {
  normalizeObjectDetections,
} from '../../core/aidetection_to_pluginbox.js'

import {
  shapeVehicleAnalysisResponse,
  shapePersonAnalysisResponse,
  shapeClassificationAnalysisResponse,
  shapeMultipleRisk,
} from '../../core/shape_aps_responses.js'

export const getResponseBody = (reqId, status) => ({
  // status must be valid, not_valid, or not_performed.
  // not_performed has meant to some connectors that they
  // should immediately retry. Check with the on-prem
  // connectors team about how they interpret this value.
  data: {
    id: reqId,
    type: 'alarm-analysis',
    attributes: {
      analytics: { resultSummary: status },
    },
  },
})

/*--------------------
  Helper functions for getting the analytics response body
--------------------*/
const getResultSummary = ({ valid, error }) => {
  if (error) {
    return { detectionResult: 'not_performed' }
  }
  return valid ? { detectionResult: 'valid' } : { detectionResult: 'not_valid' }
}
const getResultSummaryRisk = (analytics) => {
  if (analytics.securityRisks.error && analytics.environmentalHazards.error) {
    return { detectionResult: 'not_performed' }
  }
  return analytics.valid ? { detectionResult: 'valid' } : { detectionResult: 'not_valid' }
}

const getResultSummaries = (analyticsResult) => {
  const summaries = {}

  if (analyticsResult.face) {
    summaries.faceAnalysis = getResultSummary(analyticsResult.face)
  }
  if (analyticsResult.vehicle) {
    summaries.vehicleAnalysis = getResultSummary(analyticsResult.vehicle)
  }
  if (analyticsResult.person) {
    summaries.personAnalysis = getResultSummary(analyticsResult.person)
  }
  if (analyticsResult.sceneClassification) {
    summaries.sceneClassification = getResultSummary(analyticsResult.sceneClassification)
  }
  if (analyticsResult.multipleRisk) {
    summaries.multipleRiskAnalysis = getResultSummaryRisk(analyticsResult.multipleRisk)
  }

  return summaries
}

const getAnalytics = (analyticsProp, getter) => (analytics, ctx) => {
  const result = analytics[analyticsProp]
  if (result) {
    return getter(result, ctx)
  }
}

const normalizeFloatDetections = (analyticsResult, ctx) => {
  if (!isEmpty(analyticsResult.detectionsFloat)) {
    return {
      boundingBoxes: normalizeObjectDetections(
        analyticsResult.detectionsFloat,
        ctx.imageBuffers.length,
      ),
    }
  }
}

const shapeFace = (analyticsResult) => ({
  faces: analyticsResult.faces,
  paravisionVersion: analyticsResult.version,
})

const shapeGun = (analyticsResult) => ({
  isGun: analyticsResult.valid,
})

const shapeVehicle = (analyticsResult, ctx) => {
  const {
    companyCapabilities,
  } = ctx

  return shapeVehicleAnalysisResponse(
    analyticsResult,
    companyCapabilities,
  )
}

const shapePerson = (analyticsResult, ctx) => {
  const {
    companyCapabilities,
    detections,
  } = ctx

  return shapePersonAnalysisResponse(
    analyticsResult,
    companyCapabilities,
    detections,
  )
}

const getObject = getAnalytics('object', normalizeFloatDetections)
const getAdvanced = getAnalytics('advanced', normalizeFloatDetections)
const getVehicle = getAnalytics('vehicle', shapeVehicle)
const getPerson = getAnalytics('person', shapePerson)
const getFace = getAnalytics('face', shapeFace)
const getSceneClassification = getAnalytics('sceneClassification', shapeClassificationAnalysisResponse)
const getVehicleChip = getAnalytics('vehicleChips', shapeVehicle)
const getPersonChip = getAnalytics('personChips', shapePerson)
const getGunChip = getAnalytics('gun', shapeGun)
const getFaceChip = getAnalytics('face', shapeFace)
const getLprChip = getAnalytics('lpr', shapeVehicle)
const getMultipleRisk = getAnalytics('multipleRisk', shapeMultipleRisk)

export const getAnalyticsResponse = (analyticsResult, ctx, alarmType) => {
  const getObjectDetection = alarmType === 'advanced' ? getAdvanced : getObject

  const analytics = {
    resultSummaries: getResultSummaries(analyticsResult),

    objectDetection: getObjectDetection(analyticsResult, ctx),
    vehicleAnalysis: getVehicle(analyticsResult, ctx),
    personAnalysis: getPerson(analyticsResult, ctx),
    faceAnalysis: getFace(analyticsResult, ctx),
    sceneClassification: getSceneClassification(analyticsResult, ctx),
    multipleRiskAnalysis: getMultipleRisk(analyticsResult, ctx),
  }

  return analytics
}

export const getChipAnalyticsResponse = (analyticsResult, ctx) => {
  // Chip results for vehicle analysis and LPR detections are returned
  // in the same prop.
  const vehicleResponse = getVehicleChip(analyticsResult, ctx) || getLprChip(analyticsResult, ctx)

  return {
    faceDetection: getFaceChip(analyticsResult, ctx),
    gunDetection: getGunChip(analyticsResult, ctx),
    vehicleAnalysis: vehicleResponse,
    personAnalysis: getPersonChip(analyticsResult, ctx),
  }
}
