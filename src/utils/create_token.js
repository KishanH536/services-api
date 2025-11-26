import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { QueryTypes } from 'sequelize'

import { jwtSecret } from '../../config/auth.js'

const { INSERT } = QueryTypes

export const CALIPSA_API_TOKEN_TYPE = 'calipsa-api'

const TOKEN_SALT_ROUNDS = 10

async function createToken({
  id, type, payload, note, userId, siteId, expiresIn, storeToken,
}, sql, t) {
  let expireObject = {}
  if (expiresIn) {
    expireObject = { expiresIn }
  }
  const token = jwt.sign(payload, jwtSecret, expireObject)

  if (storeToken) {
    const maskedToken = token.slice(-5)
    const hashedToken = await bcrypt.hash(token, TOKEN_SALT_ROUNDS)
    const tokenData = {
      id,
      userId,
      token: hashedToken,
      maskedToken,
      type,
      note,
    }
    if (siteId) {
      tokenData.siteId = siteId
    }
    await sql.models.token.create(
      tokenData,
      {
        type: INSERT,
        raw: true,
        transaction: t,
      },
    )
  }
  return token
}

export async function createPartnerChildCompanyToken(sql, t, { id, userId }) {
  const type = CALIPSA_API_TOKEN_TYPE
  const payload = {
    id,
    userId,
    tokenType: type,
  }
  return await createToken({
    id,
    type,
    payload,
    userId,
    storeToken: true,
  }, sql, t)
}
