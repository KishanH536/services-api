import {
  map,
} from '../../utils/generic.js'

const timestampFromUuid = (
  uuid,
  offsetMs = 0,
) => {
  const timestampHex = uuid
    .replaceAll(/-/g, '')
    .slice(0, 12)

  const timestamp = Number.parseInt(timestampHex, 16)
  return new Date(timestamp + offsetMs).toISOString()
}

// Create UUIDv7-like string that can be used as a
// bound for the sort key.
const uuidFromTimestamp = (timestamp) => {
  const timestampHex = new Date(timestamp)
    .getTime()
    .toString(16)
    .padStart(12, '0')

  // UUID v7 format: xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx
  // First 48 bits are timestamp,
  // next 4 bits are version (7)
  return [
    timestampHex.slice(0, 8),
    timestampHex.slice(8, 12),
    '7000', // version 7
    '8000', // variant
    '0000000000',
  ].join('-')
}

// Normalize an analysis result item
const normalizeResult = (analysisResult) => {
  const {
    analysisResult: {
      data: {
        attributes: resultAttributes,
      },
    },
    createdAt,
    analysisId,
    companyId,
    siteId,
    viewId,
    viewConfig,
  } = analysisResult

  return {
    analysisResult: resultAttributes,
    createdAt,
    analysisId,
    companyId,
    siteId,
    viewId,
    viewConfig,
  }
}

const normalizeResults = map(normalizeResult)

export {
  uuidFromTimestamp,
  timestampFromUuid,
  normalizeResult,
  normalizeResults,
}
