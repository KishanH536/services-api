import { randomUUID as uuid } from 'node:crypto'

import calipsaUtils from '@calipsa/utils'

import { services } from '../../services/index.js'

import {
  permissions,
  products,
} from '../../constants/index.js'

import {
  createPartnerChildCompanyToken,
} from '../../utils/create_token.js'

import {
  defaultSceneChangeConfiguration,
} from './defaults.js'

const { randomId } = calipsaUtils

const {
  company: {
    admin: companyAdminPermission,
  },
} = permissions

const toUserCompanyPermissionRow = (userId, companyId) => permissionId => ({
  userId,
  companyId,
  permissionId,
})

const createRows = ({
  name,
  createdBy,
  companyType,
  product,
  companyUserPermissions,
  capabilities,
  daysToRetainData,
  integratorId,
  logCreation,
}) => async transaction => {
  const {
    DB: sql,
    Capabilities: capabilitiesService,
  } = services

  const { models } = sql
  const companyRow = {
    name,
    createdBy,
    companyType,
    product,
    alarmRetentionDays: daysToRetainData,
    tamperingConfig: defaultSceneChangeConfiguration,
    integratorId,
    /*
     * TODO: what about these?
     * paymentType,
     * defaultSiteTimezone,
     * theme,
     * isTamperingUnlocked,
     * advancedIdleAlertConfig
     *
    */
  }
  const {
    id: companyId,
    integratorId: createdIntegratorId,
  } = await models.company.create(
    companyRow,
    { transaction },
  )
  const userRow = {
    companyId,
    email: randomId(),
    password: '',
  }

  const { id: userId } = await models.user.create(
    userRow,
    { transaction },
  )

  const userCompanyPermissionRows = companyUserPermissions
    .map(toUserCompanyPermissionRow(userId, companyId))

  await sql.models.userCompanyPermission.bulkCreate(
    userCompanyPermissionRows,
    { transaction },
  )

  await capabilitiesService
    .setCapabilities(companyId, capabilities, { transaction })

  const tokenId = uuid()
  const token = await createPartnerChildCompanyToken(
    sql,
    transaction,
    {
      id: tokenId,
      userId,
    },
  )

  await logCreation({
    companyId,
    transaction,
  })

  return {
    userId,
    companyId,
    tokenId,
    token,
    integratorId: createdIntegratorId,
  }
}

export const createRowsTransaction = async ({
  displayName,
  partnerUserId,
  capabilities,
  daysToRetainData,
  integratorId,
  logCreation,
}) => {
  const { DB: sql } = services
  return sql.transaction(
    createRows({
      name: displayName,
      createdBy: partnerUserId,
      companyType: null,
      product: products.PLATFORM,
      companyUserPermissions: [
        companyAdminPermission,
      ],
      capabilities,
      daysToRetainData,
      integratorId,
      logCreation,
    }),
  )
}
