import {
  facesMlHost,
  facesMlPort,
  facesMlProtocol,
} from '../../config/ml.js'

export default async (
  logger,
  embeddings,
  uniqueRequestId,
  path,
) => {
  const mlUrl = `${facesMlProtocol}://${facesMlHost}:${facesMlPort}/${path}`

  const response = await fetch(mlUrl, {
    method: 'post',
    headers: {
      'content-type': 'application/json',
      'X-Request-ID': uniqueRequestId,
    },
    body: JSON.stringify(embeddings),
  })

  const contentType = response.headers.get('content-type')
  const result = await response.json()

  let errorMessage
  if (response.ok) {
    if (contentType?.startsWith('application/json')) {
      return result
    }
    errorMessage = 'Unusual response from ML service'
  }
  else {
    errorMessage = 'ML returned an unsuccessful response'
  }

  logger.error(
    {
      responseCode: response.status,
      contentType,
    },
    errorMessage,
  )
  const error = new Error(errorMessage)
  throw error
}
