import { createHmac } from 'crypto'

import bcrypt from 'bcrypt'

// NOTE: This code is being flagged by GitHub checkers as insecure. It says
//       that a robust algo like bcrypt should be used, which it is. I think
//       it may be confused by the hash being split into two steps. Also, as
//       described below, this is what Calipsa is currently doing.

// Following comment from src/handlers/auth/password/v3.js in api-server:
//
// Bcrypt-based, 11 salt rounds.
// Because of the limitation of 51 characters which can be passed to Bcrypt,
// the password needs to be prehashed first.
const SALT_ROUNDS = 11

function prehashPlainText(algoCostSalt, plainTextPassword) {
  // The createHmac function returns an Hmac object configured for sha256
  //   using algoCostSalt as its key and returning the Hmac object.
  // The update method performs the operation, storing the data in the
  //   object and returning the Hmac object
  // The digest method outputs a base64 string of the result.
  return createHmac('sha256', algoCostSalt).update(plainTextPassword).digest('base64')
}

export async function hash(plainTextPassword) {
  // The following hashing functionality is taken directly from the api-server
  //   code. There is an CodeQL issue with this in GitHub, but we are not
  //   planning to change this on account of needing to remain compatible (?).
  const algoCostSalt = await bcrypt.genSalt(SALT_ROUNDS)
  const prehashed = prehashPlainText(algoCostSalt, plainTextPassword)
  return await bcrypt.hash(prehashed, algoCostSalt)
}

export async function compare(plainTextPassword, hashedPassword) {
  // As above, this was taken from Calipsa api-server code.
  const algoCostSalt = hashedPassword.slice(0, -31)
  const prehashed = prehashPlainText(algoCostSalt, plainTextPassword)
  return await bcrypt.compare(prehashed, hashedPassword)
}
