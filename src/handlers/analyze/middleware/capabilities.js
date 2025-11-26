import { checkDetectionCapabilities } from '../../../utils/check_capabilities.js'

import {
  error403,
  error500,
} from '../../../common/error_response.js'

import { companyIsNotEligible } from './sceneChange/payloads.js'

export default async (ctx, req, res, next) => {
  const {
    company,
    integratorCompany,
  } = req

  const {
    detections,
    options: {
      sceneChange,
    },
  } = ctx

  // Capabilities are split into mandatory detections and tampering
  // since we don't want to prevent processing if tampering is not available.
  const {
    tampering,
    ...mandatoryDetections
  } = detections

  // First check mandatory detections.
  try {
    const {
      valid,
      missingCapabilities,
      companyCapabilities,
    } = await checkDetectionCapabilities(integratorCompany?.id || company.id, mandatoryDetections)

    ctx.companyCapabilities = companyCapabilities

    if (!valid) {
      req.logger.warn({
        missingCapabilities,
        companyId: integratorCompany?.id || company.id,
      }, 'Company does not have the necessary capabilities')

      return error403(res)
    }
  }
  catch (err) {
    req.logger.error(err, 'Error checking capabilities')
    return error500(res)
  }

  // Need to check capabilities only for on-demand scene change, because we
  // don't want to change legacy tampering behaviour for existing companies
  // (those companies may not have the "DETECT_SCENE_CHANGE" capability, in particular
  // existing Calipsa companies)
  // On-demand scene change occurs when the `force` and `perform` options are true.
  if (sceneChange.force && sceneChange.perform) {
    try {
      const {
        valid,
      } = await checkDetectionCapabilities(integratorCompany?.id || company.id, { tampering })

      if (!valid) {
        req.logger.warn({
          companyId: integratorCompany?.id || company.id,
        }, 'Requested scene change detection but company does not have the capability. Overriding requested scene change detection.')

        // Prevent scene change detection.
        ctx.detections.tampering = companyIsNotEligible(integratorCompany?.id || company.id)
      }
    }
    catch (err) {
      req.logger.error(err, 'Error checking tampering capabilities')
      return error500(res)
    }
  }

  await next()
}
