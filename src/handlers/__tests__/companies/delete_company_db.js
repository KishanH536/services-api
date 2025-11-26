import { jest } from '@jest/globals'

let mockSql
jest.unstable_mockModule('../../../services', () => ({
  services: {
    DB: mockSql,
  },
}))

const { default: mockHttp } = await import('../utils/mock-http.js')

const { default: initDB } = await import('../../../core/__tests__/utils/init_db.js')
const { getCompanyByName } = await import('../../../core/__tests__/utils/db_crud.js')
const { configureCompanies } = await import('../utils/db_helper.js')

// The handler to test.
let deleteCompanyHandler

describe('Delete company.', () => {
  // let mockSql
  let parentCompany
  let childCompany
  let parentUser

  beforeAll(async () => {
    mockSql = await initDB()

    // Need to require after the mock is set up.

    const { deleteCompany } = await import('../../company/index.js')
    deleteCompanyHandler = deleteCompany

    const {
      childCompany: createdChildCompany,
      parentCompany: createdParentCompany,
      parentUser: createdParentUser,
    } = await configureCompanies(mockSql)

    childCompany = createdChildCompany
    parentCompany = createdParentCompany
    parentUser = createdParentUser
  })

  afterAll(async () => {
    await mockSql.close()
  })

  it('Should delete a company.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    request.auth.userId = parentUser.id
    request.companyId = parentCompany.id
    ctx.request.params = {
      companyId: childCompany.id,
    }

    // Act
    await deleteCompanyHandler(ctx, request, response)

    const company = await getCompanyByName(mockSql, childCompany.name)

    // Assert
    expect(response.statusCode).toBe(204)
    expect(company.deletedAt).not.toBeNull()
  })
})
