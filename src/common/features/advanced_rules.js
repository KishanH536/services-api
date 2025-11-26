import { detectionTypeNames } from '../../constants/index.js'

import {
  toResourceTransformers,
  toRowDetectionDetailsTransformers,
} from './transformers.js'

// Convert DB rows to "features-style" advanced rules
export const rowsToAdvancedRuleFeatures = (rows) => {
  if (!rows?.length) {
    return
  }

  return rows
    .filter(rule => rule.active)
    .map(rule => {
      const detectionName = detectionTypeNames[rule.detectionType]
      const toResource = toResourceTransformers[detectionName]

      return toResource?.(rule)
    })
    .filter(Boolean)
}

// convert "feature-style" advanced rules to DB row entries
export const advancedRuleFeaturesToRows = (rules) => {
  if (!rules) {
    return []
  }

  return rules.map((rule) => {
    const {
      integratorId,
      name,
      objectType,
      categories,
      zones,
    } = rule

    // Find first property of the feature rule that matches a `detectionType`
    const [
      detectionType,
      detectionName,
    ] = Object
      .entries(detectionTypeNames)
      .find(([, value]) => value in rule)

    const toRowDetectionDetails = toRowDetectionDetailsTransformers[detectionName]
    const details = toRowDetectionDetails(rule[detectionName])

    const row = {
      integratorId,
      name,
      active: true,
      objectType: objectType || 'mixed',
      detectionType,
      ...details, // Can be any combination of detectionPeriod, detectionMin, detectionMax, meta
      zones: zones || [],
      categories,
    }

    return row
  })
}
