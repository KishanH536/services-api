import capabilitiesService from '@msi-calipsa/capabilities-lib'

/**
 * @typedef {Object} CapabilitiesService
 * @property {function} getCapabilities Gets the capabilities for a company
 * @property {function} setCapabilities Sets the capabilities for a company
 */

/**
 * Starts the capabilities service.
 * @returns {Promise<{
*  service: CapabilitiesService
* }>}
*/
export const startCapabilities = async (services) => {
  const { DB: db } = services
  const service = capabilitiesService(db)

  return {
    service,
  }
}
