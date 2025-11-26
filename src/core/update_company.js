import { services } from '../services/index.js'

// It is expected that the calling code has done all the checks to ensure
// this company can and should be updated. For example, that the user ID
// of the request matches the company's created_by user ID.
export const updateCompany = async (
  companyId,
  displayName,
  capabilities,
  alarmRetentionDays,
) => {
  let updatedCompany = {}

  const {
    DB: sql,
    Capabilities: capabilitiesService,
  } = services

  await sql.transaction(async t => {
    const [affectedCount, affectedRows] = await sql.models.company.update(
      {
        name: displayName,
        alarmRetentionDays,
      },
      {
        where: {
          id: companyId,
        },
        returning: true,
        transaction: t,
      },
    )

    if (affectedCount > 0) {
      updatedCompany = affectedRows[0]
    }

    await capabilitiesService.setCapabilities(
      companyId,
      capabilities,
      { transaction: t },
    )
  })

  return {
    updatedCompany,
    updatedCapabilities: capabilities,
  }
}

export const patchCompanyName = async (companyId, displayName) => {
  let updatedCompany = {}

  const { DB: sql } = services
  const [affectedCount, affectedRows] = await sql.models.company.update(
    {
      name: displayName,
    },
    {
      where: {
        id: companyId,
      },
      returning: true,
    },
  )

  if (affectedCount > 0) {
    updatedCompany = affectedRows[0]
  }

  return {
    updatedCompany,
  }
}
