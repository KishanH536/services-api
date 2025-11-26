import util from 'util'

import {
  runApi,
  runPrometheus,
} from '../server.js'

/**
 * Starts an HTTP service.
 * @param {() => Promise<Server>} startServer
 * @returns {Promise<{
*  service: Server,
*  stop: () => Promise<void>
* }>}
*/
const startHttp = async (startServer) => {
  const httpServer = await startServer()

  return {
    service: httpServer,
    stop: async () =>
      await util.promisify(httpServer.close).bind(httpServer)(),
  }
}

export const startApi = () => startHttp(runApi)
export const startPrometheus = () => startHttp(runPrometheus)
