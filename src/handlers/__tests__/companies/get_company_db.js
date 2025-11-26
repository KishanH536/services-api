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

// The handlers to test.
let getCompanyHandler
let getCompaniesHandler

describe('Get company.', () => {
  // let mockSql
  let parentCompany
  let childCompany
  let parentUser

  beforeAll(async () => {
    mockSql = await initDB()

    // Need to require after the mock is set up.

    const {
      getCompany,
      getCompanies,
    } = await import('../../company/index.js')
    getCompanyHandler = getCompany
    getCompaniesHandler = getCompanies

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

  it('Should get a company.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    request.auth.userId = parentUser.id
    request.companyId = parentCompany.id
    ctx.request.params = {
      companyId: childCompany.id,
    }

    // Act
    await getCompanyHandler(ctx, request, response)
    const {
      data: {
        id,
        attributes,
      },
    } = response._getJSONData()

    // Assert
    expect(response.statusCode).toBe(200)
    expect(id).toBe(childCompany.id)
    expect(attributes.displayName).toBe(childCompany.name)
    expect(attributes.daysToRetainData).toBe(childCompany.alarmRetentionDays)

    expect(attributes.capabilities)
      .toStrictEqual(testCapabilities.map(({ name }) => name.toLowerCase()))
  })

  it('Should get all companies.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    request.auth.userId = parentUser.id
    request.companyId = parentCompany.id

    // Act
    await getCompaniesHandler(ctx, request, response)
    const { data } = response._getJSONData()

    // Assert
    expect(response.statusCode).toBe(200)
    expect(data.length).toBe(1)
    expect(data[0].id).toBe(childCompany.id)

    const { attributes } = data[0]
    expect(attributes.displayName).toBe(childCompany.name)
    expect(attributes.daysToRetainData).toBe(childCompany.alarmRetentionDays)

    expect(attributes.capabilities)
      .toStrictEqual(testCapabilities.map(({ name }) => name.toLowerCase()))
  })

  it("Should return a 404 if it's can't find the company.", async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    request.auth.userId = parentUser.id
    request.companyId = parentCompany.id
    ctx.request.params = {
      companyId: 'f279be96-00ba-460e-80dd-aa053f7a3fb7', // Does not exist in test container DB.
    }

    // Act
    await getCompanyHandler(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(404)
  })
})
