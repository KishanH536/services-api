import {
  logCompanyDeletion,
} from '../../core/audit_log.js'

import { softDeleteCompanyById } from '../../core/delete_company.js'
import { services } from '../../services/index.js'

import {
  checkPermissionHandler,
  checkParentUserHandler,
} from './checks.js'

const performOperation = async (ctx, req, res) => {
  const { companyId } = ctx.request.params
  const {
    logger,
    clientIp,
    auth: {
      userId,
    },
    userType,
  } = req

  const { DB: sql } = services
  await sql.transaction(async transaction => {
    await softDeleteCompanyById(companyId, transaction)
    await logCompanyDeletion({
      userId,
      userType,
      companyId,
      log: logger,
      clientIp,
      transaction,
    })
  })

  res.sendStatus(204)
}

export default {
  performOperation,
  checks: [
    checkPermissionHandler,
    checkParentUserHandler,
  ],
}
