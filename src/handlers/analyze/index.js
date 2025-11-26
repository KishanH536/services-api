import { wrapMiddlewareWithContext } from '../../utils/middleware.js'

import analyzeAlarm from './alarm.js'
import analyzeChip from './chip.js'
import analyzeImages from './analysis.js'
import analysisMiddleware from './middleware/index.js'

const alarm = wrapMiddlewareWithContext(
  analysisMiddleware.platform.alarm,
  analyzeAlarm,
)

const chip = wrapMiddlewareWithContext(
  analysisMiddleware.platform.chip,
  analyzeChip,
)

const images = wrapMiddlewareWithContext(
  analysisMiddleware.platform.analysis,
  analyzeImages,
)

const alarmIntegrator = wrapMiddlewareWithContext(
  analysisMiddleware.integrator.alarm,
  analyzeAlarm,
)

const chipIntegrator = wrapMiddlewareWithContext(
  analysisMiddleware.integrator.chip,
  analyzeChip,
)

const imagesIntegrator = wrapMiddlewareWithContext(
  analysisMiddleware.integrator.analysis,
  analyzeImages,
)

export {
  alarm as analyzeAlarm,
  chip as analyzeChip,
  images as analyzeImages,
  alarmIntegrator as analyzeAlarmIntegrator,
  chipIntegrator as analyzeChipIntegrator,
  imagesIntegrator as analyzeImagesIntegrator,
}
