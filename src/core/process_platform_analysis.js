import {
  MultipartForm,
} from '@msi-calipsa/multipart'

import {
  APS_HOST,
  APS_PORT,
} from '../../config/aps.js'

import {
  parseAnalysisResponse,
  parseChipResponse,
} from '../common/parse_aps_response.js'
import { ApsInvalidImagesError } from '../common/errors/index.js'
import {
  logApsResponse,
} from '../utils/log_aps.js'

// add the camelCase versions of APS response props for consistent processing
const normalizeResult = (result) => ({
  ...result,
  aiMeta: result.ai_meta,
  alarmType: result.alarm_type,
})

const apsCall = (endpoint, parseResponse, logResponse) => async ({
  options,
  images,
  imageUrls,
  uniqueRequestId,
  logger,
}) => {
  const hasImageUrls = !!imageUrls

  let body
  const headers = {
    'X-Request-ID': uniqueRequestId,
  }

  const apsUrl = `http://${APS_HOST}:${APS_PORT}/${endpoint}`

  if (hasImageUrls) {
    body = JSON.stringify({
      options,
      images: imageUrls,
    })
    headers['Content-Type'] = 'application/json'
  }
  else {
    body = new MultipartForm()
    body.appendJson('options', options)
    // Add the image part(s)
    for (const image of images) {
      body.appendJpeg('images', image)
    }
  }

  const response = await fetch(apsUrl, {
    method: 'post',
    headers,
    body,
  })

  const contentType = response.headers.get('content-type')
  logger.info(`APS response content-type is ${contentType}`)

  // First check the response status:
  if (response.status >= 400) {
    logger.error(
      {
        responseCode: response.status,
        contentType,
      },
      'APS returned an error',
    )
    // Special case for 422, APS is indicating that invalid images were found.
    if (response.status === 422) {
      throw new ApsInvalidImagesError('Invalid images found in the request')
    }
    throw new Error('APS returned an unsuccessful response')
  }

  if (contentType != null && contentType.startsWith('multipart')) {
    // includes "regular-alarm" and legacy "tampering-only" responses
    const responseForm = await response.formData()

    // Get info
    const infoBlob = responseForm.get('info')
    const infoJson = JSON.parse(await infoBlob.text())
    const result = parseResponse(normalizeResult(infoJson))

    /*
     * For type "regular-alarm", these are the modified images.
     * For type "tampering-only" (legacy flow), these are the current and reference images.
    */
    const responseImages = responseForm.getAll('images')

    return {
      ...result,
      images: responseImages,
    }
  }

  if (contentType?.startsWith('application/json')) {
    // Includes analysis-style, chip-style and on-demand "tampering-only" responses
    // APS can also return application/json for errors, so this code
    // ensures that the response is ok. Otherwise it will throw an error.
    const result = await response.json()
    logResponse(logger, result)

    if (response.ok) {
      return parseResponse(normalizeResult(result))
    }
  }

  // Finally, log a warning and throw an error if neither multipart nor json.
  // This is an unusual condition, since status codes greater than 400 are handled above.
  // This could occur for a 200 response with an unexpected content-type, 300-399 response, etc.
  logger.warn(
    {
      responseCode: response.status,
      contentType,
    },
    'Unexpected response from APS',
  )

  throw new Error('APS returned an allegedly successful response but the body was not parseable')
}

const processAnalysis = apsCall('analysis', parseAnalysisResponse, logApsResponse)
const processChip = apsCall('chip', parseChipResponse, logApsResponse)

export {
  processAnalysis,
  processChip,
}
