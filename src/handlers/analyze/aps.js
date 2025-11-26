import {
  DEFAULT_TZ,
} from '../../../config/misc.js'

export const getOptionsFromContext = (ctx, company, logger) => {
  const {
    cameraData: {
      viewId,
      viewName,
      siteId,
      siteName,
      projectId,
      masks,
      viewStatus,
      tampering,
      // TODO - I don't think this does what we think it does.
      // `null` is not replaced by default values. Only `undefined` is.
      // Look into implications of starting to send the default time zone.
      siteTimezone = DEFAULT_TZ,
      isForensicUnlocked,
      isAdvancedForensicUnlocked,
    },
    detections,
  } = ctx

  // Temporary hack for VM. They will be sending us requests on views that have
  // both vehicle and classification set as features, as they need to do
  // vehicle chips to get embeddings, and they also need to do full-frame scene
  // classification. This code eliminates full-frame vehicle detection if both
  // vehicle and classification is present in ctx.detections.
  //
  // Even after we switch to parallel processing, and both would be allowed, we
  // don't want to incur the cost of doing both. When we add detection requests
  // as an option for full-frame processing, this can be removed, since VM will
  // ask for only classification in thier requests.
  if (Object.hasOwn(detections, 'classification') && Object.hasOwn(detections, 'vehicle')) {
    delete detections.vehicle
  }

  const response = {
    options: {
      masks: masks || [], // Masks are ignored in APS for chips.
      siteName,
      companyId: company.id,
      companyName: company.name,
      // needs to be undefined instead of null for APS optional UUID check.
      integrationPartnerId: company.createdByCompanyId || undefined,
      // needs to be undefined instead of null for APS optional string check.
      integrationPartnerName: company.createdByCompanyName || undefined,
      product: company.product,
      viewId,
      timezone: siteTimezone,
      detections,
      hiRes: true,
      imageRetentionDays: company.alarmRetentionDays,
      viewInfo: {
        status: viewStatus,
        isSnapshot: false, // Services API will handle setting the snapshot and updating the flag.
        isTampering: !!tampering,
        cameraName: viewName,
        siteId,
        projectId,
        isForensicUnlocked: !!isForensicUnlocked,
        isAdvancedForensicUnlocked: !!isAdvancedForensicUnlocked,
      },
    },
  }
  logger.info({ response }, 'Options for APS (MCAP processing via context)')
  return response
}
