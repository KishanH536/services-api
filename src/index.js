import logger from './common/logger.js'
import bootstrap from './bootstrap/index.js'

bootstrap(logger)
  .catch(err => {
    logger.warn('Error bootstrapping')
    logger.error(err)
  })
