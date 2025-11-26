import { jest } from '@jest/globals'

const testUserId = 'test-user-id'
const testSiteId = 'test-site-id'
const testSite = '606-0842'

const mockDbQuery = jest.fn(() => [testSite])

jest.unstable_mockModule('../../db', () => ({
  initDB: jest.fn().mockImplementation(() => ({
    query: mockDbQuery,
  })),
}))

const { default: verifySite } = await import('../site_from_company.js')

describe('Find a site', () => {
  afterEach(() => {
    mockDbQuery.mockClear()
  })

  it('Should call the DB function to verify the site', async () => {
    // Act
    await verifySite(testUserId, testSiteId)

    // Assert
    expect(mockDbQuery.mock.calls).toHaveLength(1)
  })

  it('Should provide the correct parameters to the DB function.', async () => {
    // Act
    await verifySite(testUserId, testSiteId)

    // Assert
    const {
      replacements: { userId, siteId },
    } = mockDbQuery.mock.calls[0][1]

    expect(userId).toBe(testUserId)
    expect(siteId).toBe(testSiteId)
  })

  it('Should verify the site', async () => {
    // Act
    const site = await verifySite(testUserId, testSiteId)

    // Assert
    expect(site).toEqual(true)
  })

  it.each([null, []])(
    'Should return false if there are no sites returned by the query',
    async (queryResult) => {
      // Arrange
      mockDbQuery.mockResolvedValueOnce(queryResult)

      // Act
      let site = await verifySite(testUserId, testSiteId)
      site = !!site

      // Assert
      expect(site).toEqual(false)
    },
  )
})
