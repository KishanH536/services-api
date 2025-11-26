import { QueryTypes } from 'sequelize'

import { services } from '../services/index.js'

export const getCurrentUser = async ({ log, userId }) => {
  const QUERY = /* sql */ `
    SELECT
    row_to_json(row)::jsonb as data
    FROM (
      SELECT * FROM users WHERE id = :userId
    ) row
  `

  const { DB: sql } = services
  try {
    const rows = await sql.query(QUERY, {
      type: QueryTypes.SELECT,
      replacements: { userId },
    })

    const row = rows?.[0]
    if (row) {
      return row.data
    }
  }
  catch (err) {
    log.error(err, 'Error reading user version')
  }

  return null
}

const logOperation = async (opts) => {
  const {
    log,
    transaction,
    objectType,
    operation,
    userId,
    userType,
    objectId,
    directory = null,
    change = null,
    v0 = null,
    parentType = null,
    parentId = null,
    companyId = null,
    tableName = objectType,
    clientIp = null,
    v1 = null,
    columns = '*',
  } = opts

  const meta = {
    clientIp,
  }

  const QUERY = /* sql */ `
    INSERT INTO audit_log (
      user_id,
      company_id,
      project_id,
      site_id,
      object_id,
      object_type,
      operation,
      directory,
      change,
      v0,
      v1,
      parent_type,
      parent_id,
      meta,
      user_type
    )
    SELECT
      :userId,
      coalesce(:companyId, p.company_id),
      p.id as project_id,
      s.id as site_id,
      :objectId,
      :objectType,
      :operation,
      :directory,
      :change,
      :v0,
      coalesce(:v1,row::jsonb),
      :parentType,
      :parentId,
      :meta,
      :userType
    FROM (
      SELECT row_to_json(row) as row FROM (
        SELECT ${columns} FROM ${tableName || objectType} WHERE id = :objectId
      ) row
    ) x
    LEFT JOIN sites_all s ON s.id IN ((row->>'site_id')::uuid, (row->>'id')::uuid )
    LEFT JOIN projects p ON p.id IN ((row->>'project_id')::uuid, (row->>'id')::uuid, s.project_id)
    WHERE :v0 IS NULL OR coalesce(:v1::jsonb,row::jsonb) != :v0
  `

  const { DB: sql } = services
  try {
    return await sql.query(QUERY, {
      type: QueryTypes.INSERT,
      replacements: {
        userId,
        objectId,
        objectType,
        operation,
        directory,
        change,
        v0: v0 ? JSON.stringify(v0) : null,
        parentType,
        parentId,
        companyId,
        meta: JSON.stringify(meta),
        v1: v1 ? JSON.stringify(v1) : null,
        userType,
      },
      transaction,
    })
  }
  catch (err) {
    log.error(err, 'Audit logger: could not save object')
  }
}

export const logUserUpdate = async ({
  user, userType, companyId, log, clientIp, transaction,
}) => await logOperation({
  log,
  objectType: 'users',
  operation: 'UPDATE',
  userId: user.id,
  userType,
  objectId: user.id,
  companyId,
  change: 'Update user',
  v0: user,
  clientIp,
  transaction,
})

export const logCompanyCreation = async ({
  userId,
  userType,
  companyId,
  log,
  clientIp,
  transaction,
}) => await logOperation({
  log,
  objectType: 'companies',
  operation: 'CREATE',
  userId,
  userType,
  objectId: companyId,
  companyId,
  change: 'Create company',
  clientIp,
  transaction,
})

export const logCompanyDeletion = async ({
  userId,
  userType,
  companyId,
  log,
  clientIp,
  transaction,
}) => await logOperation({
  log,
  objectType: 'companies',
  operation: 'DELETE',
  userId,
  userType,
  objectId: companyId,
  companyId,
  change: 'Delete company',
  clientIp,
  transaction,
})
