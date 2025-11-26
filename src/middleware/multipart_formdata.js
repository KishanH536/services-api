import multer, { MulterError } from 'multer'

import { error400 } from '../common/error_response.js'

const MAX_NUM_IMAGES = 6
// https://github.com/expressjs/multer/blob/master/lib/multer-error.js#L10
const MULTER_FILE_LIMIT_ERROR_MESSAGE = 'LIMIT_UNEXPECTED_FILE'

const getMultipartMiddleware = ({ imageFields, jsonFields = [] }) => {
  const parseFormData = !imageFields?.length
    ? multer().none()
    : multer({
      storage: multer.memoryStorage(),
    })
      .fields(
        imageFields.map(field => (
          {
            name: field,
            maxCount: MAX_NUM_IMAGES,
          }
        )),
      )

  return (req, res, next) => parseFormData(req, res, (err) => {
    // Handle any errors that occurred during the parsing of the form data.
    if (err) {
      let logMsg = 'Error parsing form data.'
      let errMsg = 'Error parsing form data.'

      if (err instanceof MulterError && err.code === MULTER_FILE_LIMIT_ERROR_MESSAGE) {
        logMsg = 'Too many images uploaded.'
        errMsg = `Too many images uploaded. Maximum number of images is ${MAX_NUM_IMAGES}.`
      }

      req.logger.error(err, logMsg)
      error400(res, errMsg)

      // Flush remaining data in the request stream
      // to prevent the request from hanging.
      req.resume()
      return
    }

    // Parse the JSON fields
    for (const field of jsonFields) {
      if (req.body[field]) {
        try {
          req.body[field] = JSON.parse(req.body[field])
        }
        catch {
          return error400(res, `Expected ${field} part to be JSON parsable.`)
        }
      }
    }

    next()
  })
}

export default getMultipartMiddleware
