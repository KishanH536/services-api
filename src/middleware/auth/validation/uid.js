import util from 'util'

import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

import {
  unifiedIdJwksUrl,
} from '../../../../config/auth.js'
import { AuthenticationError } from '../../../common/errors/index.js'

const keyFetchClient = jwksClient({
  jwksUri: unifiedIdJwksUrl,
})

// Gets the token signing key from Unified ID
function getKey(header, callback) {
  keyFetchClient.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey
    callback(err, signingKey)
  })
}

const jwtVerify = util.promisify(jwt.verify)

export const verifyToken = async (log, decodedToken, token) => {
  let verifiedToken
  const algorithmString = decodedToken.header?.alg || 'RS256'

  try {
    verifiedToken = await jwtVerify(
      token,
      getKey,
      { algorithms: [algorithmString] },
    )
  }
  catch (err) {
    // If there is an issue getting the signing key, the error will not
    // technically be due to a bad token, so 401 is not precisely correct, but
    // there doesn't seem to be a way to differentiate, as the library casts
    // all errors as type jwt.JsonWebTokenError regardless of source.
    log.error({
      error: err,
    }, 'Invalid Unified ID token')
    throw new AuthenticationError()
  }

  // Payload has to have client_id, which is an MCAP companyId
  if (!Object.hasOwn(verifiedToken, 'client_id')) {
    log.error({
      tokenPayload: verifiedToken,
    }, 'No client_id in Unified ID token')
    throw new AuthenticationError()
  }

  const companyId = verifiedToken.client_id
  log.info({
    companyId,
  }, 'Company identified from verified UID token')

  return companyId
}
