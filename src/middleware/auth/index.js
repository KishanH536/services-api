import jwt from 'jsonwebtoken'

import { error401 } from '../../common/error_response.js'
import { AuthenticationError } from '../../common/errors/index.js'

import { getAuthenticator } from './authenticators/index.js'

const parseAuthToken = ({
  headers,
  logger,
}) => {
  if (!headers?.authorization) {
    logger.error('Auth header not found in request')
    return null
  }
  const parts = headers.authorization.split(' ')
  if (parts[0]?.toLowerCase() !== 'bearer') {
    logger.error('Auth not of type "bearer"')
    return null
  }
  const token = parts[1]
  if (!token) {
    logger.error('No token present in header')
    return null
  }

  let decodedToken
  try {
    decodedToken = jwt.decode(token, { complete: true })
    if (!decodedToken) {
      logger.error('No token payload')
      return null
    }
  }
  catch {
    logger.error('Token decode error')
    return null
  }

  logger.info({
    tokenInfo: decodedToken.payload,
  }, 'Decoded token information')

  return {
    decodedToken,
    token,
  }
}

/**
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const tokenValidator = async (req, res, next) => {
  const {
    logger,
    headers,
  } = req

  const parsedData = parseAuthToken({
    headers,
    logger,
  })

  if (!parsedData) {
    return error401(res)
  }

  const {
    decodedToken,
    token,
  } = parsedData

  // capture tenant IDs for requests where integration partners are operating on
  // behalf of their customer (tenant).
  const tenantId = req.header('x-tenant-id')
  const tenantIntegratorId = req.header('x-tenant-integrator-id')

  const authenticator = getAuthenticator(
    logger,
    decodedToken,
    tenantId,
    tenantIntegratorId,
  )

  try {
    const {
      userId,
      integratorCompanyId,
    } = await authenticator(token)

    // Belt and suspenders. Probably shouldn't have a null/undefined userId, but
    // just in case, do a 401 response.
    if (!userId) {
      req.logger.error({
        decodedToken,
      }, 'Error verifying token - no userId')

      return error401(res)
    }

    req.auth = {
      userId,
      // Don't include any token info here or else the
      // user validation middleware will use the token ID to
      // look up the token in the DB, which will fail for UID
    }
    // Assign both so we're consistent with the validate_user code and its
    // handling of companies.
    req.integratorCompany = { id: integratorCompanyId }
    req.integratorCompanyId = integratorCompanyId
  }
  // For the caught error, if it's an instance of AuthenticationError thrown in
  // one of the above functions, then respond with 401. If not, then it's
  // a 500 error (e.g., DB, network).
  catch (err) {
    if (err instanceof AuthenticationError) {
      return error401(res)
    }

    req.logger.error({
      decodedToken,
    }, 'Error verifying token')
    return next(err)
  }

  return next()
}

export default tokenValidator
