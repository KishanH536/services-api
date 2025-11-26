import { registerServices } from '../services/index.js'
import { startDb } from '../services/db.js'
import { startDynamo } from '../services/dynamo/index.js'
import { startRedshift } from '../services/redshift.js'
import {
  startApi,
  startPrometheus,
} from '../services/http_server.js'
import { startCapabilities } from '../services/capabilities.js'

import getServiceManager from './serviceManager.js'
import startProcessListeners from './process.js'

/*
 * If a buffer is anywhere inside an object given to the logger,
 * it will be "printed" in full.
 *
 * Avoid this by overriding the `toJSON` method of the Buffer prototype.
 */
const polluteBufferPrototype = () => {
  Buffer.prototype.toJSON = function toJSON() {
    return {
      type: 'buffer',
      length: this.length,
      data: '<redacted>',
    }
  }
}

/**
 * Bootstrap services.
 * @param {*} log
 * @returns {Promise<void>}
 */
const bootstrap = async (log) => {
  polluteBufferPrototype()

  const serviceManager = getServiceManager(log)
  const { services, startService, shutdown } = serviceManager

  const processStatus = startProcessListeners(shutdown, log)

  try {
    log.info('Starting services during bootstrapping')
    await startService('DB', startDb)
    await startService('Dynamo', startDynamo)
    await startService('Redshift', startRedshift)
    await startService('Capabilities', startCapabilities)

    registerServices(services)

    await startService('API', startApi)
    await startService('Prometheus', startPrometheus)

    return serviceManager
  }
  catch (err) {
    log.fatal(err, 'Exception starting services, shutting down...')
    if (!processStatus.shutdownInProgress) {
      shutdown()
    }
  }
}

export default bootstrap
