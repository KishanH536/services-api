import { jest } from '@jest/globals'

jest.unstable_mockModule('../../db', () => ({
  initDB: jest.fn(),
}))

const { default: getSharedSite } = await import('../get_shared_site.js')
const { default: mockHttp } = await import('../../handlers/__tests__/utils/mock-http.js')
const { initDB } = await import('../../db/index.js')

const testSiteId = 'testSiteId'
const testUserId = 'testUserId'
const testCompanyId = 'testCompanyId'

const mockSharedSite = {
  id: testSiteId,
  userId: testUserId,
  companyId: testCompanyId,
}

describe('Get shared site', () => {
  let mockSql
  beforeEach(() => {
    mockSql = {
      query: jest.fn(),
    }
    initDB.mockResolvedValue(mockSql)
  })

  it('Should return null if a shared site is not found', async () => {
    mockSql.query.mockResolvedValue([])
    const { request, response } = mockHttp()

    const sharedSite = await getSharedSite(request, response, testUserId, testSiteId)

    expect(sharedSite).toBe(null)
  })

  it('Should return a shared site', async () => {
    mockSql.query.mockResolvedValue([mockSharedSite])
    const { request, response } = mockHttp()

    const sharedSite = await getSharedSite(request, response, testUserId, testSiteId)

    expect(response).toEqual(expect.not.objectContaining({ statusCode: '' }))
    expect(sharedSite).toEqual(mockSharedSite)
  })
})
