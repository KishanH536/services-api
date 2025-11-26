import { OpenAPIBackend } from 'openapi-backend'
import addFormats from 'ajv-formats'

import {
  openApiValidationError,
  error404,
  error403,
} from '../common/error_response.js'
import { validateTimeZone } from '../common/validation.js'

import {
  MY_BASE_URL_FOR_LINKS as myBaseUrl,
  VALIDATE_RESPONSES as validateResponses,
} from '../../config/misc.js'

import { postResponseHandler } from './handlers.js'

import operations from './operations.js'

// Helper function to format custom validations
const ajvFormat = (validate, type = 'string') => ({
  type,
  validate,
})

const api = new OpenAPIBackend({
  definition: './openapi/index.json',
  apiRoot: myBaseUrl,
  quick: true,
  customizeAjv: (ajv) => {
    addFormats(ajv, ['uuid', 'uri-reference', 'date-time'])
    ajv.addFormat('timeZone', ajvFormat(validateTimeZone))
    return ajv
  },
})

api.register({
  // Handlers
  ...operations,

  // Errors
  patchClientIntegrator: (c, req, res) => error403(res),
  patchSiteIntegrator: (c, req, res) => error403(res),
  patchViewIntegrator: (c, req, res) => error403(res),
  patchClientSiteViewIntegrator: (c, req, res) => error403(res),
  validationFail: async (c, req, res) => openApiValidationError(res, c.validation.errors),
  notFound: (c, req, res) => error404(res),
  notImplemented: (c, req, res) => error404(res),

  // Add post response handler if configuration specifies.
  ...validateResponses && { postResponseHandler },
})

api.init()

export default api
