/**
 * Creates JSON:API-compliant error responses and sends them as the response.
 *
 * @param  {} res
 * @param  {} code
 * @param  {} errors
 * @param  {} id
 */
function response(res, code, errors, id) {
  const json = {
    errors: errors.map(err => ({
      ...err,
      status: code.toString(),
    })),
  }
  if (id) {
    json.errors[0].id = id // Only on the first error?
  }
  res.type('application/vnd.api+json').status(code).json(json)
}

/**
 * Include 'code' in error response object if included in options. 'code' is the
 * application-level error code, not the HTTP response status code.
 *
 * https://github.com/msi-calipsa/error-codes
 *
 * @param {string} message - value of the 'detail' key
 * @param {Record<string, string>} options - can contain an error code
 * @returns {Record<string, string>[]}
 */
const toErrorsArray = (message, options = {}) => [{
  detail: message,
  ...options,
}]

const toJsonApiError = (openapiError) => {
  const { message: detail, ...meta } = openapiError

  return {
    detail,
    meta,
  }
}

export function openApiValidationError(res, errors) {
  response(res, 400, errors.map(toJsonApiError))
}

export function error400(res, message, options = {}) {
  response(res, 400, toErrorsArray(message ?? 'Bad Request', options))
}

export function error401(res) {
  response(res, 401, toErrorsArray('Unauthorized'), res.guid)
}

export function error403(res) {
  response(res, 403, toErrorsArray('Forbidden'), res.guid)
}

export function error404(res, message, options = {}) {
  response(res, 404, toErrorsArray(message ?? 'Not Found', options))
}

export function error410(res, message, options = {}) {
  response(res, 410, toErrorsArray(message ?? 'Gone', options))
}

export function error500(res, options = {}) {
  response(res, 500, toErrorsArray('Internal Server Error', options), res.guid)
}
