import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/retrieve_camera_data', () => ({
  getView: jest.fn(),
}))

jest.unstable_mockModule('../../../common/s3', () => ({
  getSnapshotUrl: jest.fn(),
  getTamperingRefUrl: jest.fn(),
}))

const { default: getSnapshotIntegrator } = await import('../../integrator/get_snapshot.js')
const { default: mockHttp } = await import('../utils/mock-http.js')

const { getView: retrieveCameraData } = await import('../../../core/retrieve_camera_data.js')

const {
  getSnapshotUrl,
  getTamperingRefUrl,
} = await import('../../../common/s3.js')

const testCameraIntegratorId = 'TestCameraIntegratorId'
const testCompanyId = '7c5b931d-62e6-4e9d-9c3f-27d5074c5dcb'
const testViewId = 'b51af614-1561-4ebb-a883-aaf229c971a4'

const validRequestParams = {
  cameraIntegratorId: testCameraIntegratorId,
}

const mockCamera = {
  companyId: testCompanyId,
  viewId: testViewId,
  tamperingConfig: {
    day: {
      referenceImage: 'day-ref-image',
    },
    night: {
      referenceImage: 'night-ref-image',
    },
  },
}
const mockCameraNoDay = {
  companyId: testCompanyId,
  viewId: testViewId,
  tamperingConfig: {
    day: {
      referenceImage: null,
    },
    night: {
      referenceImage: 'night-ref-image',
    },
  },
}
const mockCameraNoNight = {
  companyId: testCompanyId,
  viewId: testViewId,
  tamperingConfig: {
    day: {
      referenceImage: 'day-ref-image',
    },
    night: {
      referenceImage: null,
    },
  },
}

describe('Request Errors', () => {
  it('Should return not found if the camera is not found', async () => {
    // Arrange
    retrieveCameraData.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSnapshotIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(404)
  })

  it.each([['day', mockCameraNoDay],
    ['night', mockCameraNoNight]])('Should return not found when specific image is missing', async (refImage, camera) => {
    // Arrange
    retrieveCameraData.mockResolvedValue(camera)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.query.refImage = refImage

    // Act
    await getSnapshotIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(404)
  })

  it('Should return 500 if retrieving camera throws an error', async () => {
    // Arrange
    retrieveCameraData.mockImplementation(() => {
      throw new Error('Test Error')
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSnapshotIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(500)
  })

  it('Should return 500 if URL creation throws an error (getSnapshotUrl)', async () => {
    // Arrange
    retrieveCameraData.mockResolvedValue(mockCamera)
    getSnapshotUrl.mockImplementation(() => {
      throw new Error('Test Error')
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSnapshotIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(500)
  })

  it('Should return 500 if URL creation throws an error (getTamperingRefUrl)', async () => {
    // Arrange
    retrieveCameraData.mockResolvedValue(mockCamera)
    getTamperingRefUrl.mockImplementation(() => {
      throw new Error('Test Error')
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.query.refImage = 'day'

    // Act
    await getSnapshotIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(500)
  })
})

describe('Successful Redirect', () => {
  it('Should redirect if a URL is successfully created', async () => {
    // Arrange
    const goodUrl = 'http://foo.bar/stuff'
    const cacheControl = 'max-age=3600'
    retrieveCameraData.mockResolvedValue(mockCamera)
    getSnapshotUrl.mockImplementation(() => goodUrl)
    getTamperingRefUrl.mockImplementation(() => goodUrl)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSnapshotIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(301)
    expect(response.getHeader('location')).toBe(goodUrl)
    expect(response.getHeader('cache-control')).toBe(cacheControl)
  })

  it('Should redirect if a URL is successfully created for ref image', async () => {
    // Arrange
    const goodUrl = 'http://foo.bar/stuff'
    const cacheControl = 'max-age=3600'
    retrieveCameraData.mockResolvedValue(mockCamera)
    getSnapshotUrl.mockImplementation(() => goodUrl)
    getTamperingRefUrl.mockImplementation(() => goodUrl)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.query.refImage = 'day'

    // Act
    await getSnapshotIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(301)
    expect(response.getHeader('location')).toBe(goodUrl)
    expect(response.getHeader('cache-control')).toBe(cacheControl)
  })
})
