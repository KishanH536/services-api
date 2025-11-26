import {
  services,
} from '../../services/index.js'

import {
  getCompaniesByPartnerUserId,
} from '../../core/find_companies.js'

import {
  error400,
} from '../../common/error_response.js'

import {
  mapOutgoingCapabilities,
} from './map_capabilities.js'

import {
  assembleCollectionResponse,
} from './create_response.js'

import { checkPermissionHandler } from './checks.js'

async function performOperation(ctx, req, res) {
  const {
    userId: partnerUserId,
  } = req.auth

  // page[size] enables pagination using the page size requested by the client.
  const pagination = ctx.request.query
  const pageSize = pagination['page[size]']
  const pageAfter = pagination['page[after]']
  const pageBefore = pagination['page[before]']

  if (pageAfter && pageBefore) {
    const errorMessage = 'Request may not contain both \'page[after]\' and \'page[before]\' query parameters.'
    return error400(res, errorMessage)
  }

  // When getting companies, pass a page size that's one larger than the client
  // requested to determine if there is a next page
  const companies = await getCompaniesByPartnerUserId(
    partnerUserId,
    {
      pageSize: Number.parseInt(pageSize, 10) + 1,
      pageAfter,
      pageBefore,
    },
  )
  // Non-paginated responses are always the last (and only) page
  const lastPage = pageSize ? companies.length <= pageSize : true

  // Remove the extra company from the end of the returned array, but only for
  // paginated requests and not for the last page.
  if (pageSize && !lastPage) {
    companies.pop()
  }

  // The pageBefore query returns the companies in DESC order, so reverse the
  // array so that all responses are ordered in the same direction.
  if (pageBefore) {
    companies.reverse()
  }

  const { Capabilities: capabilitiesService } = services
  const capPromises = companies.map(async company => {
    // TODO: fetch capabilities for each company in parallel.
    const capabilities = await capabilitiesService.getCapabilities(company.id)
    return {
      companyId: company.id,
      displayName: company.name,
      daysToRetainData: company.alarmRetentionDays,
      capabilities: mapOutgoingCapabilities(capabilities),
      integratorId: company.integratorId,
    }
  })

  const companiesWithCapabilities = await Promise.all(capPromises)

  const success = assembleCollectionResponse(
    ctx,
    companiesWithCapabilities,
    {
      pageSize,
      pageBefore,
      pageAfter,
      lastPage,
    },
  )

  res.json(success)
}

export default {
  performOperation,
  checks: [checkPermissionHandler],
}
