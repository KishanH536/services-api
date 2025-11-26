import {
  error500,
} from '../../common/error_response.js'

import {
  services,
} from '../../services/index.js'

import {
  mapOutgoingCapabilities,
} from './map_capabilities.js'

import {
  assembleResponse,
} from './create_response.js'

import {
  checkPermissionHandler,
  checkParentUserHandler,
} from './checks.js'

async function performOperation(ctx, req, res) {
  const {
    logger,
  } = req

  const {
    company,
  } = ctx

  if (!company) {
    // ctx.company should be set by the "checks" middleware.
    logger.error('Unable to get company from request context')
    return error500(res)
  }

  const { Capabilities: capabilitiesService } = services
  const capabilities = await capabilitiesService.getCapabilities(company.id)

  const success = assembleResponse(ctx, {
    companyId: company.id,
    displayName: company.name,
    capabilities: mapOutgoingCapabilities(capabilities),
    daysToRetainData: company.alarmRetentionDays,
    integratorId: company.integratorId,
  })
  res.json(success)
}

export default {
  performOperation,
  checks: [
    checkPermissionHandler,
    checkParentUserHandler,
  ],
}
