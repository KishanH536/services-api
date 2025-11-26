import { jest } from '@jest/globals'

const testUserId = 'test-user-id'
const testClientIntegratorId = 'test-client-integrator-id'
const testSiteIntegratorId = 'test-site-integrator-id'
const testSiteId = 'test-site-id'
const testSite = { calipsaSiteId: testSiteId }

const mockDbQuery = jest.fn(() => [testSite])

jest.unstable_mockModule('../../db', () => ({
  initDB: jest.fn().mockImplementation(() => ({
    query: mockDbQuery,
  })),
}))

const {
  getSiteByIntegratorId,
  getSiteById,
} = await import('../get_site.js')

describe('Find a site by integrator ID', () => {
  afterEach(() => {
    mockDbQuery.mockClear()
  })

  it('Should call the DB function to get the site', async () => {
    // Act
    await getSiteByIntegratorId(testUserId, testClientIntegratorId, testSiteIntegratorId)

    // Assert
    expect(mockDbQuery.mock.calls).toHaveLength(1)
  })

  it('Should provide the correct parameters to the DB function.', async () => {
    // Act
    await getSiteByIntegratorId(testUserId, testClientIntegratorId, testSiteIntegratorId)

    // Assert
    const {
      replacements: { userId, clientIntegratorId, siteIntegratorId },
    } = mockDbQuery.mock.calls[0][1]

    expect(userId).toBe(testUserId)
    expect(clientIntegratorId).toBe(testClientIntegratorId)
    expect(siteIntegratorId).toBe(testSiteIntegratorId)
  })

  it('Should get the site', async () => {
    // Act
    const site = await getSiteByIntegratorId(
      testUserId,
      testClientIntegratorId,
      testSiteIntegratorId,
    )

    // Assert
    expect(site).toEqual(
      expect.objectContaining({ calipsaSiteId: testSiteId }),
    )
  })

  it.each([null, []])(
    'Should return null if there are no sites returned by the query',
    async (queryResult) => {
      // Arrange
      mockDbQuery.mockResolvedValueOnce(queryResult)

      // Act
      const site = await getSiteByIntegratorId(
        testUserId,
        testClientIntegratorId,
        testSiteIntegratorId,
      )

      // Assert
      expect(site).toBeNull()
    },
  )
})

describe('Find a site by ID', () => {
  afterEach(() => {
    mockDbQuery.mockClear()
  })

  it('Should call the DB function to get the site', async () => {
    // Act
    await getSiteById(testUserId, testSiteId)

    // Assert
    expect(mockDbQuery.mock.calls).toHaveLength(1)
  })

  it('Should provide the correct parameters to the DB function.', async () => {
    // Act
    await getSiteById(testUserId, testSiteId)

    // Assert
    const {
      replacements: { userId, siteId },
    } = mockDbQuery.mock.calls[0][1]

    expect(userId).toBe(testUserId)
    expect(siteId).toBe(testSiteId)
  })

  it('Should get the site', async () => {
    // Act
    const site = await getSiteById(testUserId, testSiteId)

    // Assert
    expect(site).toEqual(
      expect.objectContaining({ calipsaSiteId: testSiteId }),
    )
  })

  it.each([null, []])(
    'Should return null if there are no sites returned by the query',
    async (queryResult) => {
      // Arrange
      mockDbQuery.mockResolvedValueOnce(queryResult)

      // Act
      const site = await getSiteById(testUserId, testSiteId)

      // Assert
      expect(site).toBeNull()
    },
  )
})
