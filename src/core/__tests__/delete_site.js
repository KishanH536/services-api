import { jest } from '@jest/globals'

jest.unstable_mockModule('../get_site', () => ({
  getSiteById: jest.fn(),
  getSiteByIntegratorId: jest.fn(),
}))

jest.unstable_mockModule('../clean_and_delete_views', () => ({
  cleanAndDeleteViews: jest.fn(),
}))

const testUserId = 'test-user-id'
const testClientIntegratorId = 'test-client-integrator-id'
const testSiteIntegratorId = 'test-site-integrator-id'
const testSiteId = 'test-site-id'
const testSite = {
  id: testSiteId,
}

const mockQuery = jest.fn()
const mockSiteCurrent = jest.fn()
const mockViewFindAll = jest.fn().mockResolvedValue([{ id: 'id1' }, { id: 'id2' }])
const mockSiteFindAll = jest.fn()

jest.unstable_mockModule('../../db', () => ({
  initDB: jest.fn().mockImplementation(() => ({
    literal: jest.fn(),
    transaction: jest.fn().mockImplementation((fn) => fn()),
    query: mockQuery,
    models: {
      viewCurrent: {
        findAll: mockViewFindAll,
      },
      site: {
        update: mockSiteCurrent,
        findAll: mockSiteFindAll,
      },
    },
  })),
}))

const {
  softDeleteSiteById,
  softDeleteSiteByIntegratorId,
} = await import('../delete_site.js')

const {
  getSiteById,
  getSiteByIntegratorId,
} = await import('../get_site.js')

describe('Delete a site by ID', () => {
  it("Returns null if the site doesn't exist or is deleted.", async () => {
    // Arrange
    getSiteById.mockResolvedValue(null)

    // Act
    const site = await softDeleteSiteById(testUserId, testSiteId)

    // Assert
    expect(site).toBeNull()
  })

  it('Returns null if the site was not updated.', async () => {
    // Arrange
    getSiteById.mockResolvedValue(testSite)
    mockSiteCurrent.mockResolvedValue([0, []])

    // Act
    const site = await softDeleteSiteById(testUserId, testSiteId)

    // Assert
    expect(site).toBeNull()
  })

  it('Returns the updated site if the site was updated.', async () => {
    // Arrange
    const now = Date.now()
    getSiteById.mockResolvedValue(testSite)
    mockSiteCurrent.mockResolvedValue([1, [{
      ...testSite,
      deletedAt: now,
    }]])

    // Act
    const site = await softDeleteSiteById(testUserId, testSiteId)

    // Assert
    expect(site.deletedAt).toBe(now)
  })
})

describe('Delete a site by integrator ID', () => {
  it("Returns null if the site doesn't exist or is deleted.", async () => {
    // Arrange
    getSiteByIntegratorId.mockResolvedValue(null)

    // Act
    const site = await softDeleteSiteByIntegratorId(
      testUserId,
      testClientIntegratorId,
      testSiteIntegratorId,
    )

    // Assert
    expect(site).toBeNull()
  })

  it('Returns null if the site was not updated.', async () => {
    // Arrange
    getSiteByIntegratorId.mockResolvedValue(testSite)
    mockSiteCurrent.mockResolvedValue([0, []])

    // Act
    const site = await softDeleteSiteByIntegratorId(
      testUserId,
      testClientIntegratorId,
      testSiteIntegratorId,
    )

    // Assert
    expect(site).toBeNull()
  })

  it('Returns the updated site if the site was updated.', async () => {
    // Arrange
    const now = Date.now()
    getSiteByIntegratorId.mockResolvedValue(testSite)
    mockSiteCurrent.mockResolvedValue([1, [{
      ...testSite,
      deletedAt: now,
    }]])

    // Act
    const site = await softDeleteSiteByIntegratorId(
      testUserId,
      testClientIntegratorId,
      testSiteIntegratorId,
    )

    // Assert
    expect(site.deletedAt).toBe(now)
  })
})
