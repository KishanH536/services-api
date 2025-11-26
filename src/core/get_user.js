import { QueryTypes } from 'sequelize'

import { initDB } from '../db/index.js'

const FIND_USER_INFO_QUERY = `
  SELECT u.id "id",
    u.name "name",
    u.company_id "companyId",
    ucp.permission_id "permissionId",
    t.type "tokenType"
  FROM public.users u
    INNER JOIN public.tokens t
      ON u.id = t.user_id
    INNER JOIN public.companies c
      ON u.company_id = c.id
    INNER JOIN public.user_companies_permissions ucp
      ON u.id = ucp.user_id
  WHERE u.id = :userId
    AND t.id = :tokenId
    AND t.deleted_at IS NULL
    AND u.deleted_at IS NULL
    AND c.deleted_at IS NULL
`

const FIND_USER_INFO_QUERY_NO_TOKEN = `
  SELECT u.id "id",
    u.name "name",
    u.company_id "companyId",
    u.email "email",
    ucp.permission_id "permissionId"
  FROM public.users u
    INNER JOIN public.companies c
      ON u.company_id = c.id
    INNER JOIN public.user_companies_permissions ucp
      ON u.id = ucp.user_id
  WHERE u.id = :userId
    AND u.deleted_at IS NULL
    AND c.deleted_at IS NULL
`

export const userRoles = {
  ADMIN_USER: 'ADMIN_USER',
  MEMBER_USER: 'MEMBER_USER',
  CREATE_COMPANY: 'CREATE_COMPANY',
}

const getUserInfo = async ({ userId, id: tokenId }) => {
  const sql = await initDB()

  let replacements
  let queryString

  // Password reset tokens are not stored in the DB, and neither are session
  //    tokens, which currently have no ID
  if (!tokenId) {
    queryString = FIND_USER_INFO_QUERY_NO_TOKEN
    replacements = { userId }
  }
  else {
    queryString = FIND_USER_INFO_QUERY
    replacements = {
      userId,
      tokenId,
    }
  }

  const rows = await sql.query(queryString, {
    replacements,
    type: QueryTypes.SELECT,
    logging: false,
  })

  if (!rows?.length) {
    return null
  }

  // ID, name, email and company all come from the users table.
  // Query is on the user ID, which much be unique, so there
  // will only be one value for each of these.
  const {
    id,
    name,
    email,
    companyId,
  } = rows[0]

  const roles = rows.map(row => userRoles[row.permissionId])

  return {
    id,
    name,
    companyId,
    email,
    roles,
  }
}

/**
 * @param {Object<{userId: string}>} auth
 *
 * @returns {Promise<{
*    id: string,
*    name: string,
*    companyId: string
*    roles: Array<string>
*  }>}
*/
export const getUserInfoByUserId = async ({ userId }) => await getUserInfo({ userId })

/**
 * @param {Object<{userId: string, id: string}>} auth
 *
 * @returns {Promise<{
*    id: string,
*    name: string,
*    companyId: string
*    roles: Array<string>
*  }>}
*/
export const getUserInfoByTokenId = async ({
  userId,
  tokenType,
  id: tokenId,
}) => await getUserInfo({
  userId,
  id: tokenId,
  tokenType,
})
