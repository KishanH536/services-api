import {
  removeFaceEmbeddings,
  removePersonChipEmbeddings,
  removePersonFullEmbeddings,
  removeVehicleChipEmbeddings,
  removeVehicleFullEmbeddings,
} from './embeddings.js'

export const logApsResponse = (log, apsResult) => {
  const {
    analytics,
    ...rest
  } = apsResult

  if (!analytics) {
    log.debug(apsResult, 'response from APS')
    return
  }

  const {
    'person-analysis': personAnalysis,
    'person-chips': personChips,
    'vehicle-analysis': vehicleAnalysis,
    'vehicle-chips': vehicleChips,
    'face-analysis': faceAnalysis,
    'face-chips': faceChips,
    ...otherAnalytics
  } = analytics

  const withoutEmbeddings = {}

  if (personAnalysis) {
    withoutEmbeddings['person-analysis'] = {
      ...personAnalysis,
      detections: removePersonFullEmbeddings(personAnalysis.detections),
    }
  }

  if (personChips) {
    withoutEmbeddings['person-chips'] = {
      ...personChips,
      persons: removePersonChipEmbeddings(personChips.persons),
    }
  }

  if (vehicleAnalysis) {
    withoutEmbeddings['vehicle-analysis'] = {
      ...vehicleAnalysis,
      detections: removeVehicleFullEmbeddings(vehicleAnalysis.detections),
    }
  }

  if (vehicleChips) {
    withoutEmbeddings['vehicle-chips'] = {
      ...vehicleChips,
      vehicles: removeVehicleChipEmbeddings(vehicleChips.vehicles),
    }
  }

  if (faceAnalysis) {
    withoutEmbeddings['face-analysis'] = {
      ...faceAnalysis,
      faces: removeFaceEmbeddings(faceAnalysis.faces),
    }
  }

  if (faceChips) {
    withoutEmbeddings['face-chips'] = {
      ...faceChips,
      faces: removeFaceEmbeddings(faceChips.faces),
    }
  }

  log.debug({
    analytics: {
      ...withoutEmbeddings,
      ...otherAnalytics,
    },
    ...rest,
  }, 'response from APS')
}
