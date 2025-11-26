import {
  unifiedIdIss,
} from '../../../../config/auth.js'

import {
  mcapAuthenticator as mcap,
  mcapTenantAuthenticator as mcapTenant,
  mcapTenantIntegratorIdAuthenticator as mcapTenantIntegratorId,
} from './mcap.js'

import {
  uidAuthenticator as uid,
  uidTenantAuthenticator as uidTenant,
  uidTenantIntegratorIdAuthenticator as uidTenantIntegratorId,
} from './uid.js'

export const getAuthenticator = (
  log,
  decodedToken,
  tenantId,
  tenantIntegratorId,
) => {
  const isUid = decodedToken.payload.iss === unifiedIdIss

  if (isUid && tenantId) {
    return uidTenant(log, decodedToken, tenantId)
  }
  if (isUid && tenantIntegratorId) {
    return uidTenantIntegratorId(log, decodedToken, tenantIntegratorId)
  }
  if (isUid) {
    return uid(log, decodedToken)
  }
  if (tenantId) {
    return mcapTenant(log, decodedToken, tenantId)
  }
  if (tenantIntegratorId) {
    return mcapTenantIntegratorId(log, decodedToken, tenantIntegratorId)
  }
  // Else it's MCAP without tenant
  return mcap(log, decodedToken)
}
