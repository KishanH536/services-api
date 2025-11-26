import Resource from './Resource.js'
import attributes from './attributes.js'

export default class Site extends Resource {
  constructor(opts, data, clientId) {
    super(opts)
    this.data = data
    this.clientId = clientId
    this.opts = {
      ...this.opts,
      id: 'calipsaSiteId',
      attributes: attributes.site,
      transform: (site) => Site.transformSiteAttributes(site),
    }
    this.setLinks()
  }

  setLinks() {
    if (Array.isArray(this.data)) {
      this.opts.topLevelLinks = {
        self: `${this.myBaseUrl}/clients/${this.clientId}/sites`,
        'http://calipsa.io/relation/client': `${this.myBaseUrl}/clients/${this.clientId}`,
      }
      this.opts.dataLinks = { self: (site) => `${this.myBaseUrl}/sites/${site.calipsaSiteId}` }
    }
  }

  static transformSiteAttributes(site) {
    site.displayName = site.name
    return site
  }

  /** @type {import('./typeDefs').Site} Site */
  /**
   * @param {Site|Site[]} data
   * @param {string} clientId
   * @returns {Object} A JSON:API compliant response object
   */
  static render(data, clientId) {
    return new this(this.opts, data, clientId).serialize('site', data)
  }
}
