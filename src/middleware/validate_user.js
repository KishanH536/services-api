import { validate } from 'uuid'

import { permissionToUserTypeMap } from '../constants/index.js'

import {
  getUserInfoByUserId,
  userRoles,
} from '../core/get_user.js'
import { getCompanyByUserId } from '../core/find_company.js'
import {
  error401,
  error403,
} from '../common/error_response.js'

/**
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const validateUser = async (req, res, next) => {
  const {
    userId,
  } = req.auth

  if (!validate(userId)) {
    req.logger.error({ userId }, 'Invalid user ID (not a UUID)')
    return error401(res)
  }

  let user
  try {
    user = await getUserInfoByUserId({ userId })
  }
  catch (err) {
    req.logger.error(err, 'Error retrieving user info from token')
    return next(err)
  }

  if (!user) {
    req.logger.error('User not found')
    return error401(res)
  }
  if (!user.roles.includes(userRoles.ADMIN_USER)) {
    req.logger.error('User is not an ADMIN')
    return error403(res)
  }

  // Add company ID and user type to request (checked above for ADMIN_USER permission).
  req.companyId = user.companyId
  req.userType = permissionToUserTypeMap.get(userRoles.ADMIN_USER)

  // Company Active Validations
  let company
  try {
    company = await getCompanyByUserId(user.id)

    if (!company) {
      req.logger.error({
        userId: user.id,
        requestCompanyId: req.companyId,
      }, 'Company was not found for given user ID')

      throw new Error('Company was not found for given user ID')
    }
  }
  catch (err) {
    req.logger.error(err, 'Error retrieving company')
    return next(err)
  }

  // Add company to request.
  req.company = company

  next()
}

export default validateUser
