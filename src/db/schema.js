/* eslint import/no-dynamic-require: 0 */
/* eslint global-require: 0 */

import logger from '../common/logger.js'

import createCompanyModel from './models/public/company.js'
import createUserModel from './models/public/user.js'
import createProjectModel from './models/public/project.js'
import createSiteModel from './models/public/site.js'
import createSiteCurrentModel from './models/public/site_current.js'
import createTokenModel from './models/public/token.js'
import createViewModel from './models/public/view.js'
import createViewUpdateModel from './models/public/view_update.js'
import createViewCurrentModel from './models/public/view_current.js'
import createPermissionModel from './models/public/permission.js'
import createUserCompaniesPermissionModel from './models/public/user_companies_permission.js'
import createUserProjectPermissionModel from './models/public/user_projects_permission.js'
import createUserSitesPermissionModel from './models/public/user_sites_permission.js'
import createPlansModel from './models/billing/plans.js'
import createCapabilityModel from './models/public/capability.js'
import createCompanyCapabilitiesModel from './models/public/company_capabilities.js'
import createAdvancedRulesModel from './models/advancedRules/rules.js'
import createCategoriesModel from './models/advancedRules/categories.js'
import createAnalyticModel from './models/public/analytic.js'
import createTamperingModel from './models/public/tampering.js'

function requireModels(sql) {
  logger.info({}, 'Loading database models')

  // The original order of operations was lexical based on 'ls'
  // We need the order to be based on the inter-model dependencies.
  //
  // Not including the new table defs at this time, as they are not being
  // used. They are defined and we can add them when needed.
  //
  createCompanyModel(sql)
  createUserModel(sql)
  createProjectModel(sql)
  createSiteModel(sql)
  createSiteCurrentModel(sql)
  createTokenModel(sql)
  createViewModel(sql)
  createViewUpdateModel(sql)
  createViewCurrentModel(sql)
  createPermissionModel(sql)
  createUserCompaniesPermissionModel(sql)
  createUserProjectPermissionModel(sql)
  createUserSitesPermissionModel(sql)
  createPlansModel(sql)
  createCapabilityModel(sql)
  createCompanyCapabilitiesModel(sql)
  createAdvancedRulesModel(sql)
  createCategoriesModel(sql)
  createAnalyticModel(sql)
  createTamperingModel(sql)

  const {
    company,
    user,
    token,
    project,
    site,
    siteCurrent,
    view,
    viewCurrent,
    permission,
    userCompanyPermission,
    userProjectPermission,
    userSitePermission,
    viewUpdate,
    companyCapabilities,
    capability,
    advancedRules,
    categories,
    analytics,
  } = sql.models

  // Couldn't make these work. Need to look into whether they are needed.
  // Probably not, since these lookup tables won't be used programmatically.
  //
  // company.belongsTo(product)
  // product.hasMany(company)
  // company.belongsTo(company_type)
  // company_type.hasMany(company)

  // I rearranged the associations below and grouped them by association pairs,
  // as I found it difficult to find the full association when they were ordered mostly by source
  // (rather than as source / target pairs), in particular as the list of associations has grown.
  // Additionally, the full association pair was missing for some of these,
  // so I added them as Sequelize requires both hasOne/hasMany and belongsTo
  // when defining a one-to-one or one-to-many relationship.

  company.hasMany(user)
  user.belongsTo(company)

  permission.hasMany(userSitePermission)
  userSitePermission.belongsTo(permission)

  permission.hasMany(userProjectPermission)
  userProjectPermission.belongsTo(permission)

  permission.hasMany(userCompanyPermission)
  userCompanyPermission.belongsTo(permission)

  company.hasMany(userCompanyPermission)
  userCompanyPermission.belongsTo(company)

  company.hasMany(companyCapabilities)
  companyCapabilities.belongsTo(company)

  companyCapabilities.hasMany(capability)
  capability.belongsTo(companyCapabilities)

  view.hasMany(analytics)
  analytics.belongsTo(view)

  analytics.hasMany(capability)
  // TODO: Can this be called multiple times (called for companyCapabilities above)
  capability.belongsTo(analytics)

  user.hasMany(userCompanyPermission)
  userCompanyPermission.belongsTo(user)

  user.hasMany(userProjectPermission)
  userProjectPermission.belongsTo(user)

  user.hasMany(userSitePermission)
  userSitePermission.belongsTo(user)

  user.hasMany(token)
  token.belongsTo(user)

  company.hasMany(project)
  project.belongsTo(company)

  project.hasMany(site)
  site.belongsTo(project)

  project.hasMany(siteCurrent)
  siteCurrent.belongsTo(project)

  project.hasMany(userProjectPermission)
  userProjectPermission.belongsTo(project)

  user.hasMany(site)
  site.belongsTo(user)

  user.hasMany(siteCurrent)
  siteCurrent.belongsTo(user)

  site.hasMany(view)
  view.belongsTo(site)

  site.hasMany(viewCurrent)
  viewCurrent.belongsTo(site)

  company.hasMany(viewCurrent)
  viewCurrent.belongsTo(company)

  site.hasMany(userSitePermission)
  userSitePermission.belongsTo(site)

  view.hasMany(viewUpdate)
  viewUpdate.belongsTo(view)

  user.hasMany(viewUpdate)
  viewUpdate.belongsTo(user)

  user.hasMany(siteCurrent)
  siteCurrent.belongsTo(user)

  view.hasMany(advancedRules)
  advancedRules.belongsTo(view)

  advancedRules.hasMany(
    categories,
    {
      foreignKey: 'rule_id',
      onDelete: 'CASCADE',
      hooks: true,
    },
  )
  categories.belongsTo(
    advancedRules,
    {
      foreignKey: 'rule_id',
    },
  )
}

export default requireModels
