/* eslint no-console: 0 */
// Logger might not be available during bootstrap or shutdown

/**
 * Starts process listeners for shutdown and uncaught exceptions.
 * @param {*} shutdown
 * @param {*} log
 * @returns {Object<{shutdownInProgress: boolean}>}
 */
export default (shutdown, log) => {
  const status = {
    shutdownInProgress: false,
  }

  const handleShutdown = async (signal) => {
    if (status.shutdownInProgress) {
      console.log(`Shutdown already in progress. Ignoring ${signal}`)
    }
    else {
      log.warn(`Shutdown requested with signal ${signal}. Shutting down...`)
      status.shutdownInProgress = true
      await shutdown()
      log.info('Shutdown complete.')
    }
  }

  const handleUncaughtException = async (err) => {
    if (status.shutdownInProgress) {
      console.log('Uncaught exception after shutdown. Ignoring.')
    }
    else if (err.message !== 'Unexpected end of form') { // CLSAPI-710: workaround for multer bug
      log.fatal(err)
      log.error('Uncaught exception. Shutting down...')
      process.kill(process.pid, 'SIGTERM')
    }
  }

  process.on('SIGINT', handleShutdown)
  process.on('SIGQUIT', handleShutdown)
  process.on('SIGTERM', handleShutdown)
  process.on('uncaughtException', handleUncaughtException)

  process.on('exit', code =>
    console.log('Process exit event with code: ', code))

  return status
}
