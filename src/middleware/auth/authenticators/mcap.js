import { getUserInfoByUserId } from '../../../core/get_user.js'
import { validateToken } from '../validation/mcap.js'

import {
  userIdFromTenantId,
  userIdFromTenantIntegratorId,
} from './helpers.js'

// Flow:
// - validate token (DB call to check if token is revoked)
// - verify token (JWT verification)
// - determine user ID
//   -- via tenant ID:
//      -- get company ID from user ID in token (DB call)
//      -- validate tenant (DB call)
//      -- get user ID from tenant ID (DB call)
//   -- via verified token:
//      -- the user ID is in the verified token

export const mcapAuthenticator = (log, decodedToken) =>
  async (token) => {
    const userId = await validateToken(
      log,
      decodedToken,
      token,
    )

    // When the X-Tenant-ID header is not set
    // the user returned is the one associated
    // with the incoming token. There is no
    // integratorCompanyId in this case.
    return {
      userId,
    }
  }

export const mcapTenantIntegratorIdAuthenticator = (
  log,
  decodedToken,
  tenantIntegratorId,
) =>
  async (token) => {
    const integratorUserId = await validateToken(
      log,
      decodedToken,
      token,
    )

    // When the X-Tenant-Integrator-ID header is set it
    // indicates that the request is from an integration
    // partner acting on behalf of that tenant company
    // integrator ID.
    // In this case, the user returned is for the
    // tenant reassignment, not the one associated with
    // the incoming token.

    // Calipsa tokens don't set companyId, so get it
    // from the integration partner user ID.
    const {
      companyId: integratorCompanyId,
    } = await getUserInfoByUserId({
      userId: integratorUserId,
    })

    const userId = await userIdFromTenantIntegratorId(
      log,
      tenantIntegratorId,
      integratorUserId,
    )

    return {
      userId,
      integratorCompanyId,
    }
  }

export const mcapTenantAuthenticator = (log, decodedToken, tenantId) =>
  async (token) => {
    const integratorUserId = await validateToken(
      log,
      decodedToken,
      token,
    )

    // When the X-Tenant-ID header is set it indicates
    // that the request is from an integration partner
    // acting on behalf of that tenant company ID.
    // In this case, the user returned is for the
    // tenant reassignment, not the one associated with
    // the incoming token.

    // Calipsa tokens don't set companyId, so get it
    // from the integration partner user ID.
    const {
      companyId: integratorCompanyId,
    } = await getUserInfoByUserId({
      userId: integratorUserId,
    })

    const userId = await userIdFromTenantId(
      log,
      tenantId,
      integratorCompanyId,
    )

    return {
      userId,
      integratorCompanyId,
    }
  }
