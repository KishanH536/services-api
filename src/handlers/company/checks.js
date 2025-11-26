import { permissions } from '../../constants/index.js'

import {
  NotFoundError,
  AuthorizationError,
} from '../../common/errors/index.js'

import { services } from '../../services/index.js'
import { getCompanyById } from '../../core/find_company.js'

import { companyPermission } from './check_permissions.js'

import {
  mapIncomingCapabilityNames,
} from './map_capabilities.js'

const {
  company: {
    createCompany: createCompanyPermission,
  },
} = permissions

// TODO: throw Forbiden error instead of replying
const hasAllPermissionsHandler = requiredPermissions =>
  async (ctx, req /* , res - unused */) => {
    // TODO make sure this correct for the tokens in use `{auth: {userId}}`
    const {
      logger,
      auth: { userId },
    } = req

    const isPermitted = await companyPermission
      .hasAll(userId, requiredPermissions)

    if (isPermitted) {
      return true
    }
    logger.debug(
      {
        userId,
        requiredPermissions,
      },
      'missing permissions',
    )
    throw new AuthorizationError()
  }

export const checkPermissionHandler = hasAllPermissionsHandler([
  createCompanyPermission,
])

// TODO: throw Forbiden error instead of replying
export const checkCapabilitiesHandler = async (ctx, req /* , res - unused */) => {
  const {
    companyId,
    integratorCompanyId,
    logger,
  } = req

  const requestedCapabilities = mapIncomingCapabilityNames(ctx.request.body.capabilities)
  ctx.requestedCapabilities = requestedCapabilities

  const { Capabilities: capabilitiesService } = services

  const capabilities = await capabilitiesService
    .checkCapabilities(integratorCompanyId || companyId, requestedCapabilities)

  if (capabilities.valid) {
    return true
  }
  const { missingCapabilities } = capabilities
  logger.debug(
    {
      companyId,
      missingCapabilities,
    },
    'missing capabilities',
  )
  throw new AuthorizationError()
}

export const checkParentUserHandler = async (ctx, req /* , res - unused */) => {
  // In some cases (e.g., integrator ID style endpoints), the company is already set.
  // If it's not, get it.
  if (!ctx.company) {
    const { companyId } = ctx.request.params
    const company = await getCompanyById(companyId)
    if (!company) {
      throw new NotFoundError('The company could not be found or has already been deleted')
    }

    // Set the company on the context.
    ctx.company = company
  }

  const {
    auth: { userId },
  } = req

  if (ctx.company.createdBy !== userId) {
    throw new AuthorizationError()
  }
  return true
}
