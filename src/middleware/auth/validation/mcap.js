import jwt from 'jsonwebtoken'

import {
  jwtSecret,
} from '../../../../config/auth.js'
import { getTokenById } from '../../../core/get_token.js'
import { AuthenticationError } from '../../../common/errors/index.js'

export const validateToken = async (log, decodedToken, token) => {
  // For Calipsa tokens, check to make sure they're not revoked.
  const validToken = await getTokenById(
    decodedToken.payload.id,
    decodedToken.payload.userId,
  )

  if (!validToken) {
    log.error({
      decodedToken,
    }, 'Token not found in DB or is revoked')
    throw new AuthenticationError()
  }

  try {
    const { userId } = jwt.verify(
      token,
      jwtSecret,
      {
        algorithms: ['HS256'],
      },
    )

    return userId
  }
  catch (err) {
    log.error({
      tokenPayload: decodedToken.payload,
      error: err,
    }, 'Invalid Calipsa token')
    throw new AuthenticationError()
  }
}
