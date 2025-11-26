import {
  error400,
} from '../common/error_response.js'

const handleJsonError = (middleware) => (req, res, next) =>
  middleware(req, res, (err) => {
    if (err instanceof SyntaxError
      && err.status === 400
      && 'body' in err
    ) {
      return error400(res, 'Invalid JSON in request body')
    }
    if (err) {
      return next(err)
    }

    next()
  })

export default handleJsonError
