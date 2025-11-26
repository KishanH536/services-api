const isUndefined = (value) => value === undefined

/**
 * @param {object} cameraStatus
 *
 * @returns {object}
 */
export default (cameraStatus) => {
  const { isHumanDetection, isVehicleDetection } = cameraStatus || {}
  const relevantClasses = { relevant_classes: 'all' }

  if ((isUndefined(isHumanDetection) || isHumanDetection === true)
      && (isUndefined(isVehicleDetection) || isVehicleDetection === true)) {
    relevantClasses.relevant_classes = 'all'
  }
  else if (isUndefined(isHumanDetection) || isHumanDetection === true) {
    relevantClasses.relevant_classes = 'person'
  }
  else if (isUndefined(isVehicleDetection) || isVehicleDetection === true) {
    relevantClasses.relevant_classes = 'vehicle'
  }

  return relevantClasses
}
