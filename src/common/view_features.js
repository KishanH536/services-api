import {
  isEmpty,
  cloneDeep,
  has,
} from 'lodash-es'

import {
  API_SERVER_BASE_URL_FOR_LINKS as apiServerBaseUrl,
} from '../../config/api_server.js'
import {
  MY_BASE_URL_FOR_LINKS as myBaseUrl,
} from '../../config/misc.js'

export const DEFAULT_FEATURES = {
  objectDetection: {
    humanDetection: {},
    vehicleDetection: {},
  },
}

/**
 * @typedef {Object} SelectionOptions
 * @property {string} key The key of the property to select from the source object
 * @property {function} condition The condition to check prior to selecting the property's value
 * @property {string} destKey (optional) The key to use when assigning the selected property to
 * the output object
 * @property {Object} destValue (optional) The value to assign to the selected property of the
 * output object
 */

/**
 * Utility function to conditionally copy properties from a source object into a new object.
 * Properties to select are identified by a `key`. If the value of the `key` property on the source
 * object is truthy, it will be included in the output object, optionally using a new key or value.
 * @param {Object} sourceObj The object to select properties from.
 * @param  {...(SelectionOptions|string)} args Options which identify the property to select and
 * how to map it.
 * @returns {Object}
 */
const selectProps = (sourceObj, ...args) =>
  args
    // Map string args into { key: arg } objects
    .map(arg => typeof arg === 'string' ? { key: arg } : arg)
    .reduce((acc, {
      key, condition = Boolean, destKey, destValue,
    }) => {
      if (condition(sourceObj[key])) {
        acc[destKey || key] = destValue || sourceObj[key]
      }
      return acc
    }, {})

/**
 * Transforms a watchListDetection (which only has ID in it) to an equivalent Services API
 * resource representation object.
 * @param {*} viewId the Calipsa ID of the associated view
 * @param {*} rule the advanced rule
 * @param {*} item the watchlist item to be transformed
 * @returns {Object} a WatchListItemResource representation of this watchlist item
 */
const toWatchListItemResource = (viewId, rule, item) => ({
  id: item.id,
  type: 'watchlist-item',
  links: {
    // The value of this URL was discovered while exploring how this works in api-server
    'http://calipsa.io/relation/current-image': `${apiServerBaseUrl}/view/watchlist/image?path=${viewId}/${rule.integratorId}/${item.id}.jpg`,
  },
})

/**
 * Transforms all IDs found within alertList and ignoreList properties into equivalent Services
 * API resource representation objects
 * @param {*} viewId the Calipsa ID of the associated view
 * @param {*} rule the advanced rule
 * @returns {Object} the WatchListDetection item with transformed WatchListItemResource objects
 * contained within
 */
const transformWatchListDetection = (viewId, rule) => {
  const detection = rule.watchListDetection
  if (detection) {
    detection.alertList = detection.alertList?.map(
      item => toWatchListItemResource(viewId, rule, item),
    )
    detection.ignoreList = detection.ignoreList?.map(
      item => toWatchListItemResource(viewId, rule, item),
    )
  }
  return rule
}

/**
 * Transforms all Services API watch list resource items into equivalient "Calipsa-style" alert
 * and ignore list items.
 * @param {*} rule the advanced rule.
 * @returns {Object} the rule with the transformed watch-list advanced detection.
 */
const transformFromWatchListDetection = (rule) => {
  const detection = rule.watchListDetection
  if (detection) {
    detection.alertList = detection.alertList?.map(item => ({ id: item.id }))
    detection.ignoreList = detection.ignoreList?.map(item => ({ id: item.id }))
  }
  return rule
}

/**
 * Transform a view's status and tampering values from the DB into a normalized "features" object.
 * @param {Object<{viewStatus: Object, tampering: Boolean}>} input
 * @returns {Object}
 */
export const transformToFeatures = ({
  calipsaViewId, viewId, viewStatus = {}, tampering, tamperingConfig, analytics,
}) => {
  // The `features` object to return,
  let features = {}

  if (!viewStatus.active) {
    // if the view isn't active, no features are active
    return features
  }

  // If there are any analytics features for the view, just put them in features
  if (analytics) {
    features = { ...analytics }
  }

  // Tampering features is set outside of the view's `status` property.
  if (tampering) {
    features.sceneChangeDetection = {}
    if (tamperingConfig?.day?.referenceImage) {
      const link = `${myBaseUrl}/views/${viewId || calipsaViewId}/snapshot?refImage=day`
      const lastUpdated = tamperingConfig.day.referenceImageUpdatedAt
      features.sceneChangeDetection.dayReferenceImage = {
        links: {
          'http://calipsa.io/relation/current-image': {
            href: link,
            meta: { lastUpdatedAt: lastUpdated },
          },
        },
      }
    }
    if (tamperingConfig?.night?.referenceImage) {
      const link = `${myBaseUrl}/views/${viewId || calipsaViewId}/snapshot?refImage=night`
      const lastUpdated = tamperingConfig.night.referenceImageUpdatedAt
      features.sceneChangeDetection.nightReferenceImage = {
        links: {
          'http://calipsa.io/relation/current-image': {
            href: link,
            meta: { lastUpdatedAt: lastUpdated },
          },
        },
      }
    }
  }

  // Object detection with humanDetection and vehicleDetection defaulting to `true` unless
  // explicitly `false`
  const objectDetection = {
    humanDetection: viewStatus.isHumanDetection !== false,
    vehicleDetection: viewStatus.isVehicleDetection !== false,
  }

  // Set default object detection if it is not explicitly `false`.
  if (viewStatus.isObjectDetection !== false) {
    Object.assign(features, { objectDetection })
  }

  // To be compatible with the old status.isForensic being `true` without
  // status.forensicConfig being present, set retentionTier to the default
  // value of 30 if no forensicConfig, otherwise map status.forensicConfig
  // to features.forensic.
  if (viewStatus.isForensic) {
    if (isEmpty(viewStatus.forensicConfig)) {
      Object.assign(features, { forensic: { retentionTier: 30 } })
    }
    else {
      Object.assign(
        features,
        selectProps(
          viewStatus,
          {
            key: 'forensicConfig',
            destKey: 'forensic',
          },
        ),
      )
    }
  }

  // Copy the advancedRules since the transformation may modify each rule object.
  const activeRules = cloneDeep(viewStatus.advancedRules?.filter(rule => rule.active))

  // TODO: Default isAdvancedAlarm flag should be false, once all existing gun detection views are
  // upgraded to include it.
  if (viewStatus.isAdvancedAlarm === false || !activeRules?.length) {
    // If there are no active advanced rules, return the features.
    return features
  }

  // Transform Advanced Rules
  // Within a rule, only include `id`, `name`, and `active` by default (they're required)
  // Also include detections which are active, and `zonesDetection`, `objectType`, and
  // `categoriesDetection` if they exist.
  features.advancedRules = activeRules.map(rule => {
    // Advanced rule detections:
    const advancedDetections = [
      'countDetection',
      'loiteringDetection',
      'gunDetection',
      'faceDetection',
      'crowdFormingDetection',
      'watchListDetection',
    ]

    const normalizedRule = selectProps(
      rule,
      {
        key: 'id',
        destKey: 'integratorId',
      },
      'name',
      'objectType',
      {
        key: 'zonesDetection',
        destKey: 'zones',
      },
      {
        key: 'categoriesDetection',
        destKey: 'categories',
      },
      ...advancedDetections.map(ad => ({
        key: ad,
        condition: detection => detection?.active,
      })),
    )

    // Strip out the "active" property of each advanced detection.
    for (const ad of advancedDetections) {
      delete normalizedRule[ad]?.active
    }
    return transformWatchListDetection(viewId, normalizedRule)
  })
  return features
}

/**
 * Transform feature-style advanced rules to the format expected by APS detections.
 * @param {Array} advancedRules
 * @returns {Array}
 */
export const transformFromFeatureRules = (advancedRules) => {
  // Copy advancedRules since the transormation may modify each rule object.
  const clonedRules = cloneDeep(advancedRules)
  return clonedRules.map(rule => {
    // Some properties have different key names,
    // the "rest" can be copied as-is.
    const {
      integratorId,
      zones,
      categories,
      ...rest
    } = rule

    // Advanced rule detections:
    const advancedDetections = [
      'countDetection',
      'loiteringDetection',
      'gunDetection',
      'faceDetection',
      'crowdFormingDetection',
      'watchListDetection',
    ]

    for (const ad of advancedDetections) {
      if (has(rest, ad)) {
        rest[ad].active = true
      }
    }

    return {
      active: true,
      id: integratorId,
      zonesDetection: zones,
      categoriesDetection: categories,
      ...transformFromWatchListDetection(rest),
    }
  })
}

/**
 * Transform a view's features into status and tampering values.
 * @param {Object<{features: Object}>} camera
 * @returns {Object}
 */
export const transformFromFeatures = (features = DEFAULT_FEATURES, options = {}) => {
  const status = { active: false }
  let tampering = false
  const analytics = {}

  if (isEmpty(features)) {
    return {
      status,
      tampering,
    }
  }

  status.active = true
  status.isObjectDetection = false
  status.isHumanDetection = false
  status.isVehicleDetection = false

  if (features.sceneChangeDetection) {
    tampering = true
  }

  if (features?.vehicleAnalysis) {
    analytics.vehicleAnalysis = features.vehicleAnalysis
  }
  if (features?.personAnalysis) {
    analytics.personAnalysis = features.personAnalysis
  }
  if (features?.sceneClassification) {
    analytics.sceneClassification = features.sceneClassification
  }
  if (features?.multipleRiskAnalysis) {
    analytics.multipleRiskAnalysis = features.multipleRiskAnalysis
  }

  // Add scene and object detection, if enabled:
  Object.assign(
    status,
    selectProps(
      features,
      {
        key: 'objectDetection',
        destKey: 'isObjectDetection',
        destValue: true,
      },
      {
        key: 'objectDetection',
        condition: od => od?.humanDetection,
        destKey: 'isHumanDetection',
        destValue: true,
      },
      {
        key: 'objectDetection',
        condition: od => od?.vehicleDetection,
        destKey: 'isVehicleDetection',
        destValue: true,
      },
      {
        key: 'forensic',
        destKey: 'isForensic',
        destValue: true,
      },
      {
        key: 'forensic',
        destKey: 'forensicConfig',
      },
    ),
  )
  // For the case where an empty object is passed in the forensic feature, set
  // the forensicConfig object to have the default retentionTier
  if (status.forensicConfig && isEmpty(status.forensicConfig)) {
    status.forensicConfig.retentionTier = 30
  }

  // persist the option to use new advanced rules table.
  if (options.isUsingNewAdvancedRules) {
    status.isUsingNewAdvancedRules = true
  }

  if (features.advancedRules?.length && !options.isUsingNewAdvancedRules) {
    status.isAdvancedAlarm = true
    status.advancedRules = transformFromFeatureRules(features.advancedRules)
  }

  return {
    status,
    tampering,
    analytics,
  }
}
