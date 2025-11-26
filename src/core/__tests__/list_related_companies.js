import { jest } from '@jest/globals'

const testCompanyId = 'b05da68e-93a9-49f2-9c18-7a34519fdbfd'
const testCompanyName = 'Acme'
const testCompanyIds = [testCompanyId]

const mockCompanies = [{
  id: testCompanyId,
  name: testCompanyName,
}]

const mockDbQuery = jest.fn(() => mockCompanies)

jest.unstable_mockModule('../../db', () => ({
  initDB: jest.fn().mockImplementation(() => ({
    query: mockDbQuery,
  })),
}))

const {
  default: listRelatedCompanies,
} = await import('../list_related_companies.js')

describe('Get companies', () => {
  afterEach(() => {
    mockDbQuery.mockClear()
  })

  it('Should call the DB function to get the companies', async () => {
    // Act
    await listRelatedCompanies(testCompanyIds)

    // Assert
    expect(mockDbQuery.mock.calls).toHaveLength(1)
  })

  it('Should provide the correct parameters to the DB function.', async () => {
    // Act
    await listRelatedCompanies(testCompanyIds)

    // Assert
    const {
      replacements: { companyIds },
    } = mockDbQuery.mock.lastCall[1]

    expect(companyIds).toBe(testCompanyIds)
  })

  it('Should get the companies', async () => {
    // Act
    const companies = await listRelatedCompanies(testCompanyIds)

    // Assert
    expect(companies).toHaveLength(mockCompanies.length)
    expect(companies[0].id).toBe(testCompanyId)
  })

  it('Should return an empty array if companyIds is empty', async () => {
    // Act
    const companies = await listRelatedCompanies([])

    // Assert
    expect(companies).toHaveLength(0)
  })
})
