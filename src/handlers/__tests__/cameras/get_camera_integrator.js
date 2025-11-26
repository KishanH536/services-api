import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/retrieve_camera_data', () => ({
  getView: jest.fn(),
}))

const {
  MY_BASE_URL_FOR_LINKS: myBaseUrl,
} = await import('../../../../config/misc.js')

const { default: getCameraIntegrator } = await import('../../integrator/get_camera.js')
const { default: mockHttp } = await import('../utils/mock-http.js')

const { getView: retrieveCameraData } = await import('../../../core/retrieve_camera_data.js')

const testCompanyId = '7c5b931d-62e6-4e9d-9c3f-27d5074c5dcb'
const testViewId = 'b51af614-1561-4ebb-a883-aaf229c971a4'
const testSiteId = 'b1b6f619-7cd5-470e-bb4e-2dffedbd9963'
const testProjectId = '16a7966c-94ed-4d71-b845-47d267e81f48'
const testDisplayName = 'Test Camera Display Name'
const testCameraIntegratorId = 'Test Camera?Integrator/Id&'

const validRequestParams = {
  cameraIntegratorId: testCameraIntegratorId,
}

const mockCamera = {
  companyId: testCompanyId,
  projectId: testProjectId,
  siteId: testSiteId,
  viewId: testViewId,
  integratorId: testCameraIntegratorId,
  viewName: testDisplayName,
  masks: [],
  snapshotSet: false,
  thermal: false,
}

describe('Request Errors', () => {
  it('Should return not found if the camera is not found', async () => {
    // Arrange
    retrieveCameraData.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getCameraIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(response.statusCode).toBe(404)
    expect(data.errors[0].status).toBe('404')
  })
})

describe('Get a camera', () => {
  beforeAll(() => {
    retrieveCameraData.mockResolvedValue(mockCamera)
  })

  it('Has the correct response structure.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getCameraIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          attributes: expect.objectContaining({
            integratorId: testCameraIntegratorId,
          }),
          id: testViewId,
          links: expect.any(Object),
          type: 'view',
        }),
      }),
    )
  })

  it('Should get a camera.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getCameraIntegrator(ctx, request, response)
    const {
      data: {
        attributes: {
          integratorId,
          displayName,
          masks,
          snapshotSet,
          thermal,
        },
      },
    } = response._getJSONData()

    // Assert
    expect(integratorId).toBe(testCameraIntegratorId)
    expect(displayName).toBe(testDisplayName)
    expect(masks).toEqual([])
    expect(snapshotSet).toBe(false)
    expect(thermal).toBe(false)
  })

  it('Should add only self to the response when snapshotSet is false', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getCameraIntegrator(ctx, request, response)
    const {
      data: { links },
    } = response._getJSONData()

    // Assert
    expect(links).toEqual(expect.objectContaining({
      self: `${myBaseUrl}/views/${testViewId}`,
    }))
    expect(links).toEqual(expect.not.objectContaining({
      'http://calipsa.io/relation/current-image': expect.any(String),
    }))
  })

  it('Should add current-image and self link to the response when snapshotSet is true', async () => {
    // Arrange
    mockCamera.snapshotSet = true
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getCameraIntegrator(ctx, request, response)
    const {
      data: { links },
    } = response._getJSONData()

    // Assert
    expect(links).toEqual(expect.objectContaining({
      self: `${myBaseUrl}/views/${testViewId}`,
      'http://calipsa.io/relation/current-image': expect.any(String),
    }))
  })
})

describe('Status codes', () => {
  it('Should return the correct status code.', async () => {
    // Arrange
    retrieveCameraData.mockResolvedValue(mockCamera)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getCameraIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(200)
  })
})

describe('Get camera failure', () => {
  it('Should send an internal server error if retrieveCameraData errors.', async () => {
    // Arrange
    retrieveCameraData.mockImplementation(() => {
      throw new Error('Test Error')
    })

    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getCameraIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
