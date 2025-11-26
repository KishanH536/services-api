import {
  error400,
} from '../../common/error_response.js'

import { patchCompanyName } from '../../core/update_company.js'
import { services } from '../../services/index.js'

import {
  mapOutgoingCapabilities,
} from './map_capabilities.js'

import {
  assembleResponse,
} from './create_response.js'

async function performOperation(ctx, req, res) {
  let { company } = req

  if (Object.hasOwn(ctx.request.body, 'displayName')) {
    const {
      displayName,
    } = ctx.request.body

    // == operator catches null and undefined
    if (displayName == null) {
      return error400(res, 'display name must not be null')
    }

    const {
      updatedCompany,
    } = await patchCompanyName(company.id, displayName)

    company = updatedCompany

    req.logger.info({
      companyId: company.id,
      displayName: company.name,
    }, 'company display name updated')
  }

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
