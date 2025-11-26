import { jest } from '@jest/globals'

const testUserId = 'test-user-id'
const testViewId = 'test-view-id'
const testView = {
  id: testViewId,
}

const mockQuery = jest.fn()

jest.unstable_mockModule('../../db', () => ({
  initDB: jest.fn(),
}))

jest.unstable_mockModule('../clean_and_delete_views', () => ({
  cleanAndDeleteViews: jest.fn(),
}))

const { initDB } = await import('../../db/index.js')

const { cleanAndDeleteViews } = await import('../clean_and_delete_views.js')

const {
  softDeleteCameraById,
  softDeleteCameraByIntegratorId,
  softDeleteSharedCameraById,
} = await import('../delete_camera.js')

describe.each([
  softDeleteCameraById,
  softDeleteCameraByIntegratorId,
  softDeleteSharedCameraById])('Delete a camera', (softDeleteCamera) => {
  let mockSql
  beforeEach(() => {
    mockSql = {
      literal: jest.fn(),
      query: mockQuery,
      transaction: (fn) => fn(),
    }
    initDB.mockResolvedValue(mockSql)
  })

  it("Returns null if the view doesn't exist.", async () => {
    // Arrange
    mockQuery.mockResolvedValue(null)
    // Act
    const view = await softDeleteCamera(testUserId, testViewId)

    // Assert
    expect(view).toBeNull()
  })

  it('Returns null if the view is already deleted.', async () => {
    // Arrange
    mockQuery.mockResolvedValue(null)

    // Act
    const view = await softDeleteCamera(testUserId, testViewId)

    // Assert
    expect(view).toBeNull()
  })

  it('Returns null if the view was not updated.', async () => {
    // Arrange
    mockQuery.mockResolvedValue([testView])
    cleanAndDeleteViews.mockResolvedValue([0, []])

    // Act
    const view = await softDeleteCamera(testUserId, testViewId)

    // Assert
    expect(view).toBeNull()
  })

  it('Returns the times the site and project were deleted at', async () => {
    // Arrange
    const now = Date.now()
    mockQuery.mockResolvedValue([{
      ...testView,
      siteDeletedAt: now,
      projectDeletedAt: now,
    }])

    cleanAndDeleteViews.mockResolvedValue([
      1,
      [{
        ...testView,
        deletedAt: now,
      }],
    ])

    // Act
    const view = await softDeleteCamera(testUserId, testViewId)

    // Assert
    expect(view.siteDeletedAt).toBe(now)
    expect(view.projectDeletedAt).toBe(now)
  })

  it('Returns the updated view if the view was updated.', async () => {
    // Arrange
    const now = Date.now()
    mockQuery.mockResolvedValue([testView])

    cleanAndDeleteViews.mockResolvedValue([1, [{
      ...testView,
      deletedAt: now,
    }]])

    // Act
    const view = await softDeleteCamera(testUserId, testViewId)

    // Assert
    expect(view.deletedAt).toBe(now)
  })
})
