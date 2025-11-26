import {
  transformToFeatures,
} from '../../../common/view_features.js'

import { getAdvancedRules } from '../../../core/get_advanced_rules.js'
import { rowsToAdvancedRuleFeatures } from '../../../common/features/advanced_rules.js'

export default async (ctx, req, res, next) => {
  const {
    viewId,
    viewStatus,
    tampering,
    tamperingConfig,
    analytics,
  } = ctx.cameraData

  const features = transformToFeatures({
    viewId,
    viewStatus,
    tampering,
    tamperingConfig,
    analytics,
  })

  if (viewStatus?.isUsingNewAdvancedRules) {
    const advancedRules = await getAdvancedRules(viewId)
    features.advancedRules = rowsToAdvancedRuleFeatures(advancedRules)
  }
  else {
    req.logger.warn(
      {
        viewId,
        status: viewStatus,
      },
      'Camera is not using new advanced rules',
    )
  }

  ctx.features = features
  await next()
}
