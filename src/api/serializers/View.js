import { transformToFeatures } from '../../common/view_features.js'

import { rowsToAdvancedRuleFeatures } from '../../common/features/advanced_rules.js'

import Resource from './Resource.js'

import attributes from './attributes.js'

export default class View extends Resource {
  constructor(opts, data, siteId) {
    super(opts)
    this.data = data
    this.siteId = siteId
    this.opts = {
      ...this.opts,
      id: 'calipsaViewId',
      attributes: attributes.view,
      transform: (view) => View.transformViewAttributes(view),
    }
    this.setLinks()
  }

  setLinks() {
    if (Array.isArray(this.data)) {
      this.opts.topLevelLinks = {
        self: `${this.myBaseUrl}/sites`
                  + `/${this.siteId}/views`,
        'http://calipsa.io/relation/legacy-site': (view) =>
          `${this.apiServerBaseUrl}/site`
            + `/${view.siteId || this.siteId}`, // view.siteId only exists when a camera is registered

      }
    }

    this.opts.dataLinks = {
      self: (view) => `${this.myBaseUrl}/views/${view.calipsaViewId || view.viewId}`,
      'http://calipsa.io/relation/current-image': (view) => view.snapshotSet
        ? `${this.myBaseUrl}/views/${view.calipsaViewId}/snapshot`
        : '',
    }
  }

  static transformViewAttributes(view) {
    view.displayName = view.name
    view.created = view.createdAt
    view.updated = view.updatedAt
    // TODO: fix this - I think it should be `view.viewStatus...`.
    view.active = view.activeStatus?.active || false
    // view.snapshot = view.snapshotSet
    view.features = transformToFeatures(view)
    if (view.viewStatus?.isUsingNewAdvancedRules) {
      view.features.advancedRules = rowsToAdvancedRuleFeatures(view.advancedRules)
    }
    return view
  }

  /**
   * @type {import('./typeDefs').View} View
   */
  /**
   * @param {View|View[]} data
   * @param {string} siteId
   * @returns {Object} A JSON:API compliant response object
   */
  static render(data, siteId) {
    return new this(this.opts, data, siteId).serialize('view', data)
  }
}
