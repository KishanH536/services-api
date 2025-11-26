import { isEmpty } from 'lodash-es'

import {
  compose,
  map,
  toLowerCase,
} from '../utils/generic.js'

// Convert all elements to lowercase strings
const toLowerCaseValues = compose(
  map(toLowerCase),
  map(String),
)

// APS response format is inconsistent, so use this to normailize
// the response validity. If either of `isValid` or `valid` are
// true, "true", or "True", then that section of the response is valid.
const normalizeValidity = ({
  isValid: isValidInput,
  valid: validInput,
  ...rest
}) => ({
  valid: toLowerCaseValues([isValidInput, validInput]).includes('true'),
  ...rest,
})

// Format the analytics properties to remove empty values
// and map the `isValid` string prop to a `valid` boolean.
const formatAnalyticsProps = (analytics) => {
  const formatValues = map(([k, v]) => [k, normalizeValidity(v)])
  return Object.fromEntries(
    formatValues(
      Object.entries(analytics).filter(([, v]) => Boolean(v)),
    ),
  )
}

const parseMultipleRisk = (analyticsResponse) => {
  const securityRisks = analyticsResponse?.['security-risks']
  const environmentalHazards = analyticsResponse?.['environmental-hazards']

  const multipleRisk = formatAnalyticsProps({
    securityRisks,
    environmentalHazards,
  })

  if (isEmpty(multipleRisk)) {
    return undefined
  }

  return {
    ...multipleRisk,
    valid: Object.values(multipleRisk).some(a => a.valid),
  }
}

const parseAnalysisResponse = (responseInfo) => {
  const {
    tampering,
    analytics: analyticsResponse,
  } = responseInfo

  const analytics = {
    face: analyticsResponse?.['face-analysis'],
    person: analyticsResponse?.['person-analysis'],
    vehicle: analyticsResponse?.['vehicle-analysis'],
    sceneClassification: analyticsResponse?.['scene-classification'],
    multipleRisk: parseMultipleRisk(analyticsResponse),
  }

  const result = {
    tampering,
    analytics: formatAnalyticsProps(analytics),
  }

  return {
    ...result,
    // legacy `valid` prop for overall analysis result
    valid: Object.values(result.analytics).some(a => a.valid),
  }
}

const parseChipResponse = (responseInfo) => {
  const {
    tampering,
    analytics: analyticsResponse,
  } = responseInfo

  const analytics = {
    gun: analyticsResponse?.['gun-chips'],
    face: analyticsResponse?.['face-chips'],
    lpr: analyticsResponse?.['lpr-chips'],
    vehicleChips: analyticsResponse?.['vehicle-chips'],
    personChips: analyticsResponse?.['person-chips'],
  }

  const result = {
    tampering,
    analytics: formatAnalyticsProps(analytics),
  }

  return {
    ...result,
    // legacy `valid` prop for overall analysis result
    valid: Object.values(result.analytics).some(a => a.valid),
  }
}

export {
  parseAnalysisResponse,
  parseChipResponse,
}
