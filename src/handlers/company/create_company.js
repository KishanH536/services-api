import {
  logCompanyCreation,
} from '../../core/audit_log.js'

import {
  assembleResponse,
} from './create_response.js'

import { createRowsTransaction } from './create_account.js'
import {
  checkPermissionHandler,
  checkCapabilitiesHandler,
} from './checks.js'

import { mapOutgoingCapabilityNames } from './map_capabilities.js'

async function performOperation(ctx, req, res) {
  const {
    logger,
    clientIp,
    auth: {
      userId: partnerUserId,
    },
    userType: partnerUserType,
  } = req

  const {
    body: {
      displayName,
      daysToRetainData = 30,
    },
    params: {
      integratorId,
    },
  } = ctx.request

  const capabilities = ctx.requestedCapabilities

  const logCreation = async ({
    companyId,
    transaction,
  }) => {
    await logCompanyCreation({
      userId: partnerUserId,
      userType: partnerUserType,
      companyId,
      log: logger,
      clientIp,
      transaction,
    })
  }

  const {
    companyId,
    tokenId,
    userId, // not returned
    integratorId: createdIntegratorId,
    token,
  } = await createRowsTransaction({
    displayName,
    partnerUserId,
    capabilities,
    daysToRetainData,
    integratorId,
    logCreation,
  })
  req.logger.info({
    companyId,
    tokenId,
    userId, // not returned
  }, 'partner child company created')

  /*
   * capabilities seems redundant in the response
   * it's what we get in the body at the moment
   */
  const success = assembleResponse(ctx, {
    companyId,
    tokenId,
    token,
    displayName,
    capabilities: mapOutgoingCapabilityNames(capabilities),
    daysToRetainData,
    integratorId: createdIntegratorId,
  })
  res.status(201).json(success)
}

export default {
  performOperation,
  checks: [
    checkPermissionHandler,
    checkCapabilitiesHandler,
  ],
}
