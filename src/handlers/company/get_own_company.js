import { services } from '../../services/index.js'

import {
  mapOutgoingCapabilities,
} from './map_capabilities.js'

import {
  assembleResponse,
} from './create_response.js'

async function performOperation(ctx, req, res) {
  const { company } = req
  const { Capabilities: capabilitiesService } = services
  const capabilities = await capabilitiesService.getCapabilities(company.id)

  const success = assembleResponse(ctx, {
    companyId: company.id,
    displayName: company.name,
    capabilities: mapOutgoingCapabilities(capabilities),
    daysToRetainData: company.alarmRetentionDays,
  }, '/company')
  res.json(success)
}

export default {
  performOperation,
  checks: [],
}
