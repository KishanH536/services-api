import { jest } from '@jest/globals'

const testUserId = 'test-user-id'
const testViewId = 'test-view-id'
const testCameraIntegratorId = 'test-camera-integrator-id'

const mockDbQuery = jest.fn()

function goodQueryResult(idType) {
  const queryResult = [
    {
      viewId: idType === 'calipsa' ? testViewId : testCameraIntegratorId,
      siteId: 'siteId',
      projectId: 'projectId9',
      siteTimezone: 'America/Chicago',
      companyId: 'companyId',
      viewName: 'viewName',
      masks: [],
      viewStatus: {
        active: true,
        isObjectDetection: false,
      },
      integratorId: 'motorolaCameraId',
      snapshotSet: false,
      thermal: false,
      tampering: false,
    },
  ]
  return queryResult
}

jest.unstable_mockModule('../../db', () => ({
  initDB: jest.fn().mockImplementation(() => ({
    query: mockDbQuery,
  })),
}))

const {
  getView: retrieveCameraData,
} = await import('../retrieve_camera_data.js')

describe('Get camera data Calipsa', () => {
  afterEach(() => {
    mockDbQuery.mockClear()
  })
  beforeEach(() => {
    mockDbQuery.mockResolvedValue(goodQueryResult('calipsa'))
  })

  it('Should call the DB function to get the camera data and analytics data', async () => {
    // Act
    await retrieveCameraData(testUserId, testViewId, 'calipsa')

    // Assert
    expect(mockDbQuery.mock.calls).toHaveLength(2)
  })

  it('Should provide the correct parameters to the DB function.', async () => {
    // Act
    await retrieveCameraData(testUserId, testViewId, 'calipsa')

    // Assert
    const {
      replacements: { userId, id },
    } = mockDbQuery.mock.calls[0][1]

    expect(userId).toBe(testUserId)
    expect(id).toBe(testViewId)
  })

  it('Should get the camera data', async () => {
    // Act
    const camera = await retrieveCameraData(testUserId, testViewId, 'calipsa')

    // Assert
    expect(camera).toEqual(
      expect.objectContaining({ viewId: testViewId }),
    )
  })

  it.each([null, []])(
    'Should return null if there is no camera returned by the query',
    async (queryResult) => {
      // Arrange
      mockDbQuery.mockResolvedValueOnce(queryResult)

      // Act
      const camera = await retrieveCameraData(testUserId, testViewId, 'calipsa')

      // Assert
      expect(camera).toBeNull()
    },
  )
})
