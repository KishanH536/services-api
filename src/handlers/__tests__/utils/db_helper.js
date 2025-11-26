import {
  createCompany,
  createUser,
  createUserCompanyPermission,
} from '../../../core/__tests__/utils/db_crud.js'

const childCompanyName = 'Child Company'
const alarmRetentionDays = 15

export const configureCompanies = async (sql) => {
  const parentCompany = await createCompany(
    sql,
    {
      name: 'Parent Company',
      product: 'PLATFORM',
    },
  )

  const parentUser = await createUser(
    sql,
    {
      companyId: parentCompany.id,
      name: 'test-user',
      product: 'PLATFORM',
    },
  )

  await createUserCompanyPermission(
    sql,
    {
      companyId: parentCompany.id,
      userId: parentUser.id,
      permissionId: 'CREATE_COMPANY',
    },
  )

  // Create child company.
  const childCompany = await createCompany(
    sql,
    {
      name: childCompanyName,
      product: 'PLATFORM',
      createdBy: parentUser.id,
      alarmRetentionDays,
    },
  )

  return {
    parentCompany,
    parentUser,
    childCompany,
    alarmRetentionDays,
  }
}
