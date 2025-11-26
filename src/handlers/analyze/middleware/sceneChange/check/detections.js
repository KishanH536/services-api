import moment from 'moment-timezone'

import {
  getTamperingDetections,
} from '../../../../../core/get_tampering_detections.js'

import {
  parseDecInt,
  compose,
} from '../../../../../utils/generic.js'

const timeStringToHourMinute = (timeString) => {
  const parts = timeString.split(':')
  const integerParts = parts.map(parseDecInt)
  const [hour, minute] = integerParts

  return {
    hour,
    minute,
  }
}

const getLocalizedPeriod = (
  timezone,
  hourMinutePeriod,
  now,
) => {
  const siteTime = moment(now).tz(timezone)
  const siteDay = siteTime.clone().startOf('day')

  const fromHourMinute = ({ hour, minute }) =>
    siteDay.clone().hour(hour).minute(minute)

  const period = hourMinutePeriod.map(fromHourMinute)

  return {
    siteTime,
    period,
  }
}

const pickTime = ({ siteTime, period }) => {
  const [smaller, bigger] = period.sort()
  const isBetween = siteTime.isBetween(smaller, bigger, 'minute', '(]')

  if (isBetween) {
    return smaller
  }

  if (siteTime > bigger) {
    return bigger
  }

  return bigger.subtract(1, 'day')
}

const momentToDate = m => m.toDate()

const getLimit = compose(momentToDate, pickTime, getLocalizedPeriod)

const getBackLimitTimestamp = (
  timezone,
  companyTamperingConfig,
  timestamp,
) => {
  const {
    firstCheckFrom,
    firstCheckTo,
  } = companyTamperingConfig

  const hourMinutePeriod = [firstCheckFrom, firstCheckTo].map(timeStringToHourMinute)

  return getLimit(timezone, hourMinutePeriod, timestamp)
}

export const isTamperingAlreadyDone = async (
  viewId,
  companyTamperingConfig,
  timezone,
  timestamp,
) => {
  const backLimit = getBackLimitTimestamp(
    timezone,
    companyTamperingConfig,
    timestamp,
  )

  const detections = await getTamperingDetections(viewId, backLimit)

  return detections?.length > 0
}
