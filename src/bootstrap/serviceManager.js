const getServiceManager = (log) => {
  const services = {}
  const stoppers = []

  const startService = async (name, starter) => {
    log.info(`Starting ${name}`)
    const { service, stop } = await starter(services, log)

    services[name] = service
    if (stop) {
      const stopper = async () => {
        try {
          await stop()
          log.info(`Stopped ${name}`)
        }
        catch (err) {
          log.error(err, `Error stopping ${name}`)
        }
      }
      stoppers.unshift(stopper)
    }

    return service
  }

  const shutdown = async () => {
    /* eslint no-await-in-loop: off */
    // Need stoppers to run one-at-a-time in order.

    for (const stopper of stoppers) {
      await stopper()
    }
  }

  return {
    services,
    startService,
    shutdown,
  }
}

export default getServiceManager
