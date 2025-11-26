import getAdminUserIdFromCompanyId from '../../../utils/find_admin_user_by_company.js'
import { AuthenticationError } from '../../../common/errors/index.js'
import { verifyToken } from '../validation/uid.js'

import {
  userIdFromTenantId,
  userIdFromTenantIntegratorId,
} from './helpers.js'

export const uidAuthenticator = (log, decodedToken) =>
  async (token) => {
    const companyId = await verifyToken(
      log,
      decodedToken,
      token,
    )

    // When the X-Tenant-ID header is not set
    // the user returned is the one associated
    // with the incoming token. There is no
    // integratorCompanyId in this case.
    const userId = await getAdminUserIdFromCompanyId(companyId)

    if (!userId) {
      log.error({
        companyId,
      }, 'No admin users for company')
      throw new AuthenticationError()
    }

    return {
      userId,
    }
  }

export const uidTenantIntegratorIdAuthenticator = (
  log,
  decodedToken,
  tenantIntegratorId,
) =>
  async (token) => {
    // UID sets the companyId directly to the integration partner ID
    const integratorCompanyId = await verifyToken(
      log,
      decodedToken,
      token,
    )

    // Need the integratorUserId to validate the tenant
    const integratorUserId = await getAdminUserIdFromCompanyId(integratorCompanyId)

    // When the X-Tenant-ID header is set it
    // indicates that the request is from an
    // integration partner acting on behalf of
    // that tenant company ID.
    // In this case, the user returned is for the
    // tenant reassignment, not the one associated
    // with the incoming token.
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

export const uidTenantAuthenticator = (log, decodedToken, tenantId) =>
  async (token) => {
    // UID sets the companyId directly to the integration partner ID
    const integratorCompanyId = await verifyToken(
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
