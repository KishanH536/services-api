import { isEmpty } from 'lodash-es'

import { ValidationContext } from 'openapi-backend'

import { mimes } from '../constants/index.js'

export const postResponseHandler = (c, req, res) => {
  const logSkipping = (reason, info) =>
    req.logger.warn({
      reason,
      ...info,
    }, 'Skipping response validation')

  if (!c.operation) {
    logSkipping('There is no operation for this request')
    return
  }

  if (isEmpty(c.operation.responses)) {
    logSkipping('No responses to validate')
    return
  }

  // Get response schema
  const response = c.operation.responses[String(res.locals.statusCode)]
  if (!response) {
    logSkipping(
      'No response with matching status code.',
      { statusCode: res.locals.statusCode },
    )
    return
  }

  const responseSchema = response.content
    && response.content[mimes.jsonApi]
    && response.content[mimes.jsonApi].schema

  if (!responseSchema) {
    logSkipping('No schemas available to validate')
    return
  }

  // Should use `getAjv` function from the OpenApiValidator class instead of creating
  // a new Ajv instance, since this function will customize Ajv using the same
  // `customizeAjv` function and `ajvOpts` (if any) which were passed when
  // instantiating OpenApiBackend.
  const validator = c.api.validator.getAjv(ValidationContext.Response)

  if (!validator.validate(responseSchema, res.locals.responseData)) {
    // Log the validation errors. This will happen after the response is sent.
    // For non-dev environments, query in kibana for logs with the
    // `responseValidationErrors` property.
    req.logger.error(
      { responseValidationErrors: validator.errors },
      'Response schema validation failed.',
    )
  }
}
