import { toZonedTime } from 'date-fns-tz'
import { getHours } from 'date-fns'

import {
  MY_BASE_URL_FOR_LINKS as myBaseUrl,
} from '../../config/misc.js'

/*-----------------------------------

  Legacy Scene Change Helper Functions

-----------------------------------*/

// Day light range 8 AM to 4 PM
const dayStartsAt = 8
const dayEndsAt = 16

// Check if it is day time in the current timezone.
const isNowDayTime = (timezone) => {
  const localised = toZonedTime(Date.now(), timezone)
  const hour = getHours(localised)
  return hour >= dayStartsAt && hour < dayEndsAt
}

// Check if the legacy-style tampering config contains any reference images.
const hasReferenceImage = (tamperingConfig) => {
  if (!tamperingConfig) {
    return false
  }

  const {
    day,
    night,
  } = tamperingConfig

  return !!(day?.referenceImage || night?.referenceImage)
}

/* -----------------------------------

  "On-Demand" Scene Change Helper Functions

----------------------------------- */

const getReferences = (tamperingConfig) => {
  const labels = ['day', 'night']

  return labels
    .map(
      label => ({
        id: tamperingConfig?.[label]?.referenceImage,
        updatedAt: tamperingConfig?.[label]?.referenceImageUpdatedAt,
        label,
      }),
    )
    .filter(ref => ref.id)
}

const getReferenceResponseUrl = (viewId, reference) => {
  if (reference.url) {
    return {
      url: reference.url,
    }
  }

  // else reference to have a label.
  return {
    url: `${myBaseUrl}/views/${viewId}/snapshot?refImage=${reference.label}`,
  }
}

// APS accepts references with either an ID or a URL.
// If the reference has an ID, the URL and any other properties should be omitted.
const sanitizeReference = ({ id, url }) => {
  if (!(id || url)) {
    throw new Error('Reference must have an ID or URL')
  }

  if (id) {
    return { id }
  }

  return { url }
}

export {
  getReferences,
  getReferenceResponseUrl,
  sanitizeReference,
  isNowDayTime,
  hasReferenceImage,
}
