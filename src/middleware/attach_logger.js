import { v7 as uuidv7 } from 'uuid'

import logger from '../common/logger.js'

/**
 * Attach a logger to the request object thus making it globally accesible.
 *
 * @param {*} req
 * @param {*} _res
 * @param {*} next
 */
const attachRequestLogger = (req, res, next) => {
  const clientRequestId = req.header('x-request-id')
  const guid = uuidv7()

  const loggerWithRequestIds = logger.child({
    requestId: guid,
    clientRequestId,
    originalUrl: req.originalUrl,
    clientIp: req.clientIp,
  })

  req.guid = guid
  req.logger = loggerWithRequestIds
  res.guid = guid

  next()
}

/**
 * Logs error messages in case there's a problem with sending the response back to the client.
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const logResponseErrors = (req, res, next) => {
  function onClose() {
    req.logger.error('Request aborted by the client')
  }

  function onError(err) {
    req.logger.error(`Request pipeline error - ${err.stack.slice(0, 200)}`)
  }

  function onFinish() {
    res.off('close', onClose)
    res.off('error', onError)
  }

  res.once('finish', onFinish)
  res.once('close', onClose)
  res.on('error', onError)

  next()
}

/**
 * Logs an info message indicating that an HTTP request has been received.
 *
 * @param {*} req
 * @param {*} _res
 * @param {*} next
 */
const logIncomingRequest = (req, _res, next) => {
  req.logger.info('Request received')
  next()
}

export default [
  attachRequestLogger,
  logResponseErrors,
  logIncomingRequest,
]
