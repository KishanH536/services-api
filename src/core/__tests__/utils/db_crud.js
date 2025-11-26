/* eslint no-console: 0 */

import { v4 as uuidv4 } from 'uuid'
import { QueryTypes } from 'sequelize'

const enableLogging = false
const logging = { logging: enableLogging }
const doLogging = enableLogging

async function createCompany(sql, {
  name, product, createdBy, alarmRetentionDays = 30, defaultSiteTimezone = null,
}) {
  const dataObject = {
    name: name || 'default_company',
    createdBy: createdBy || uuidv4(),
    alarmRetentionDays,
    defaultSiteTimezone,
  }
  if (product) {
    dataObject.product = product
  }
  const result = await sql.models.company.create(
    dataObject,
    logging,
  )
  return result
}

async function createUser(sql, {
  companyId, name, email, password, product,
}) {
  const dataObject = {
    companyId: companyId || uuidv4,
    name: name || 'default_user',
    email: email || 'defaultuser@defaultcompany.com',
    password: password || 'default_password',
  }
  if (product) {
    dataObject.product = product
  }

  try {
    const result = await sql.models.user.create(
      dataObject,
      logging,
    )
    return result
  }
  catch (err) {
    console.log('error!')
    console.log(err)
  }
}

async function createProject(sql, { companyId, integratorId, name }) {
  const dataObject = {
    companyId: companyId || uuidv4,
    integratorId,
    name: name || 'default_project',
  }
  const result = await sql.models.project.create(
    dataObject,
    logging,
  )
  return result
}

// When a project is deleted, just set the deleted_at to a date
async function deleteProject(sql, id, idType = 'calipsa') {
  const where = idType === 'calipsa' ? { id } : { integratorId: id }
  await sql.models.project.update(
    {
      deletedAt: sql.literal('CURRENT_TIMESTAMP'),
    },
    {
      where,
      logging: doLogging,
      returning: true,
    },
  )
}

//
// Site operations
//
async function createSite(sql, {
  userId, projectId, integratorId, name, timezone,
}) {
  const result = {}
  // creating a site automatically creates the record in siteCurrent
  result.site = await sql.models.site.create(
    {
      userId: userId || uuidv4(),
      projectId: projectId || uuidv4(),
      integratorId,
    },
    logging,
  )
  // update siteCurrent with values that are not copied from site
  const updateResult = await sql.models.siteCurrent.update(
    {
      name: name || 'default_site',
      timezone: timezone || 'GMT-04:00 America/New_York',
    },
    {
      where: { id: result.site.id },
      logging: doLogging,
      returning: true,
    },
  )
  // sequelize update commands return a list:
  // first position is number of records, second is the first record
  result.siteCurrent = updateResult[1]
  return result
}

// When a site is deleted via the Webpage, the site gets its deleted_at set,
// and the site_currents gets its row deleted.
async function deleteSite(sql, id, idType = 'calipsa') {
  const where = idType === 'calipsa' ? { id } : { integratorId: id }
  await sql.models.site.update(
    {
      deletedAt: sql.literal('CURRENT_TIMESTAMP'),
    },
    {
      where,
      logging: doLogging,
      returning: true,
    },
  )
  await sql.models.siteCurrent.destroy({
    where,
    logging: doLogging,
  })
}

//
// Permission operations
//
async function createPermission(sql, { id, name }) {
  const result = {}
  const pid = id || 'SHARED_SITE_USER'
  const permissionName = name || 'Shared site user'

  const permissionDataObject = {
    id: pid,
    name: permissionName,
  }
  result.permission = await sql.models.permission.create(
    permissionDataObject,
    logging,
  )
  return result
}

//
// UserCompanyPermission operations
//
async function createUserCompanyPermission(sql, { companyId, userId, permissionId }) {
  const result = {}
  const uid = userId || uuidv4()
  const cid = companyId || uuidv4()

  const userCompanyPermissionData = {
    userId: uid,
    companyId: cid,
    permissionId,
  }

  result.userCompanyPermission = await sql.models.userCompanyPermission.create(
    userCompanyPermissionData,
    logging,
  )

  return result
}

//
// UserSitePermission operations
//
async function createUserSitePermission(sql, {
  siteId, userId, permissionId, displayName,
}) {
  const result = {}
  const uid = userId || uuidv4()
  const sid = siteId || uuidv4()

  const userSitePermissionDataObject = {
    userId: uid,
    siteId: sid,
    permissionId,
    displayName: displayName || 'Test Permission',
  }
  result.userSitePermission = await sql.models.userSitePermission.create(
    userSitePermissionDataObject,
    logging,
  )
  return result
}

//
// View operations
//
async function createView(sql, {
  userId,
  siteId,
  integratorId,
  name,
  isSnapshot,
  masks,
  status,
  isThermal,
  isTampering,
  tamperingConfig,
  features,
  companyId,
}) {
  const result = {}
  const uid = userId || uuidv4()
  const sid = siteId || uuidv4()

  const viewDataObject = {
    userId: uid,
    siteId: sid,
    integratorId,
  }
  result.view = await sql.models.view.create(
    viewDataObject,
    logging,
  )

  const updateDataObject = {
    userId: uid,
    viewId: result.view.id,
    integratorId,
    isSnapshot,
    mask: masks,
    status,
    isThermal,
    isTampering,
    tamperingConfig,
    features,
    name: name || 'default_view',
  }
  result.viewUpdate = await sql.models.viewUpdate.create(
    updateDataObject,
    logging,
  )

  const currentDataObject = {
    id: result.view.id,
    userId: uid,
    siteId: sid,
    integratorId,
    isSnapshot,
    mask: masks,
    status,
    isThermal,
    isTampering,
    tamperingConfig,
    features,
    name: name || 'default_view',
    companyId,
  }
  result.viewCurrent = await sql.models.viewCurrent.create(
    currentDataObject,
    logging,
  )

  return result
}

// When a view gets deleted via the Webpage, the view gets its deleted_at
// column set to a date, the view_update is unchanged, and the view_current row
// is removed from the table.
async function deleteView(sql, id, idType = 'calipsa') {
  const where = idType === 'calipsa' ? { id } : { integratorId: id }
  await sql.models.view.update(
    {
      deletedAt: sql.literal('CURRENT_TIMESTAMP'),
    },
    {
      where,
      logging: doLogging,
      returning: true,
    },
  )
  await sql.models.viewCurrent.destroy({
    where,
    logging: doLogging,
  })
}

async function createToken(sql, {
  id, type, token, maskedToken, userId,
}) {
  const dataObject = {
    id,
    type,
    token,
    maskedToken,
    userId,
  }
  const result = await sql.models.token.create(
    dataObject,
    logging,
  )
  return result
}

async function getToken(sql, id) {
  const query = `
    SELECT * FROM public.tokens t
    WHERE t.id = :id
  `
  return await sql.query(query, {
    replacements: {
      id,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })
}

async function getCompanyByName(sql, name) {
  const query = `
    SELECT * FROM public.companies c
    WHERE c.name = :name
  `
  return await sql.query(query, {
    replacements: {
      name,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })
}

async function getBillingByCompany(sql, companyId) {
  const query = `
    SELECT * FROM billing.plans bp
    WHERE bp.company_id = :companyId
  `
  return await sql.query(query, {
    replacements: {
      companyId,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })
}

async function getUserByName(sql, name) {
  const query = `
    SELECT * FROM public.users u
    WHERE u.name = :name
  `
  return await sql.query(query, {
    replacements: {
      name,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })
}

async function getProjectByCompany(sql, companyId) {
  const query = `
    SELECT * FROM public.projects p
    WHERE p.company_id = :companyId
  `
  return await sql.query(query, {
    replacements: {
      companyId,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })
}

async function getSiteByProject(sql, projectId) {
  const query = `
    SELECT * FROM public.sites_all s
    WHERE s.project_id = :projectId
  `
  return await sql.query(query, {
    replacements: {
      projectId,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })
}

export {
  createCompany,
  createUser,
  createProject,
  createSite,
  createPermission,
  createUserCompanyPermission,
  createUserSitePermission,
  createView,
  deleteProject,
  deleteSite,
  deleteView,
  createToken,
  getToken,
  getCompanyByName,
  getBillingByCompany,
  getUserByName,
  getProjectByCompany,
  getSiteByProject,
}
