import { updateCompany } from '../../core/update_company.js'

import {
  assembleResponse,
} from './create_response.js'

import {
  checkPermissionHandler,
  checkParentUserHandler,
  checkCapabilitiesHandler,
} from './checks.js'

import { mapOutgoingCapabilityNames } from './map_capabilities.js'

async function performOperation(ctx, req, res) {
  const {
    displayName,
    daysToRetainData = 30,
  } = ctx.request.body

  const capabilities = ctx.requestedCapabilities

  const { companyId } = ctx.request.params

  const {
    updatedCompany,
    updatedCapabilities,
  } = await updateCompany(
    companyId,
    displayName,
    capabilities,
    daysToRetainData,
  )

  req.logger.info({
    companyId,
    displayName: updatedCompany.name,
    capabilities: updatedCapabilities,
  }, 'partner child company updated')

  const success = assembleResponse(ctx, {
    companyId,
    displayName: updatedCompany.name,
    capabilities: mapOutgoingCapabilityNames(updatedCapabilities),
    daysToRetainData: updatedCompany.alarmRetentionDays,
    integratorId: ctx.company?.integratorId,
  })
  res.json(success)
}

export default {
  performOperation,
  checks: [
    checkPermissionHandler,
    checkCapabilitiesHandler,
    checkParentUserHandler,
  ],
}
