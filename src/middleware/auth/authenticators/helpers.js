import { getCompanyByIntegratorId } from '../../../core/find_company.js'
import getAdminUserIdFromCompanyId from '../../../utils/find_admin_user_by_company.js'
import checkIsValidTenant from '../../../utils/check_tenant_id.js'
import { AuthenticationError } from '../../../common/errors/index.js'

export const userIdFromTenantIntegratorId = async (
  log,
  tenantIntegratorId,
  integratorUserId,
) => {
  const tenant = await getCompanyByIntegratorId(
    tenantIntegratorId,
    integratorUserId,
  )

  // This servers as the equivalent of checkIsValidTenant
  // but the additional DB call is unecessary since
  // getCompanyByIntegratorId already gets the tenant. It
  // should also only return a tenant if it's `createdBy`
  // column matches the integratorUserId, but we double
  // check here just in case.
  if (tenant?.createdBy !== integratorUserId) {
    log.error({
      tenantIntegratorId,
      integratorUserId,
    }, 'X-Tenant-Integrator-ID not a valid child company')
    throw new AuthenticationError()
  }

  log.info({
    tenantId: tenant.id,
    integratorUserId,
  }, 'Integration partner company reassignment')

  const userId = await getAdminUserIdFromCompanyId(tenant.id)

  if (!userId) {
    log.error({
      tenantId: tenant.id,
    }, 'No admin users for company')
    throw new AuthenticationError()
  }

  return userId
}

export const userIdFromTenantId = async (
  log,
  tenantId,
  integratorCompanyId,
) => {
  // First, validate the tenant
  const isValidTenant = await checkIsValidTenant(
    tenantId,
    integratorCompanyId,
  )

  if (!isValidTenant) {
    log.error({
      tenantId,
      integratorCompanyId,
    }, 'X-Tenant-ID not a valid child company')
    throw new AuthenticationError()
  }

  log.info({
    tenantId,
    integratorCompanyId,
  }, 'Integration partner company reassignment')

  const userId = await getAdminUserIdFromCompanyId(tenantId)

  if (!userId) {
    log.error({
      tenantId,
      integratorCompanyId,
    }, 'No admin users for company')
    throw new AuthenticationError()
  }

  return userId
}
