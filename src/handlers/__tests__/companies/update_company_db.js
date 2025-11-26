import { jest } from '@jest/globals'

const testCapabilities = [
  {
    id: 1,
    name: 'DETECT_FACE',
  },
  {
    id: 2,
    name: 'DETECT_GUN',
  },
]

const mockCapabilitiesService = {
  getCapabilities: jest.fn(() => testCapabilities),
  setCapabilities: jest.fn(),
  checkCapabilities: jest.fn(() => ({ valid: true })),
}

let mockSql
jest.unstable_mockModule('../../../services', () => ({
  services: {
    DB: mockSql,
    Capabilities: mockCapabilitiesService,
  },
}))

const { default: mockHttp } = await import('../utils/mock-http.js')

const { default: initDB } = await import('../../../core/__tests__/utils/init_db.js')
const { configureCompanies } = await import('../utils/db_helper.js')

// The handler to test.
let updateCompanyHandler

describe('Update company.', () => {
  // let mockSql
  let parentCompany
  let childCompany
  let parentUser

  beforeAll(async () => {
    mockSql = await initDB()

    // Need to require after the mock is set up.

    const { updateCompany } = await import('../../company/index.js')
    updateCompanyHandler = updateCompany

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

  it('Should update a company.', async () => {
    // Arrange
    const updatedName = 'New Name'
    const updatedDaysToRetainData = 10
    const updatedCapabilities = ['detect_face']

    const { ctx, request, response } = mockHttp()
    request.auth.userId = parentUser.id
    request.companyId = parentCompany.id
    ctx.request.params = {
      companyId: childCompany.id,
    }
    ctx.request.body = {
      displayName: updatedName,
      capabilities: updatedCapabilities,
      daysToRetainData: updatedDaysToRetainData,
    }

    // Act
    await updateCompanyHandler(ctx, request, response)

    const {
      data: {
        id,
        attributes,
      },
    } = response._getJSONData()

    // Assert
    expect(response.statusCode).toBe(200)
    expect(id).toBe(childCompany.id)
    expect(attributes.displayName).toBe(updatedName)
    expect(attributes.daysToRetainData).toBe(updatedDaysToRetainData)
    expect(attributes.capabilities).toStrictEqual(updatedCapabilities)
  })

  it("Should return a 404 if it's can't find the company.", async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    request.auth.userId = parentUser.id
    request.companyId = parentCompany.id
    ctx.request.params = {
      companyId: 'f279be96-0bad-460e-80dd-aa053f7a3fb7', // Does not exist in test container DB.
    }
    ctx.request.body.capabilities = ['detect_face']

    // Act
    await updateCompanyHandler(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(404)
  })
})
