import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/get_site', () => ({
  getSiteByIntegratorId: jest.fn(),
}))

jest.unstable_mockModule('../../../core/list_cameras', () => ({
  listCameras: jest.fn(),
}))

jest.unstable_mockModule('../../../core/get_advanced_rules', () => ({
  getAdvancedRulesByViewIds: jest.fn(),
}))

const {
  MY_BASE_URL_FOR_LINKS: myBaseUrl,
} = await import('../../../../config/misc.js')

const { default: getCamerasIntegrator } = await import('../../integrator/get_cameras.js')
const { default: mockHttp } = await import('../utils/mock-http.js')

const { getSiteByIntegratorId } = await import('../../../core/get_site.js')
const { listCameras } = await import('../../../core/list_cameras.js')
const { getAdvancedRulesByViewIds } = await import('../../../core/get_advanced_rules.js')

const testSiteId = 'b1b6f619-7cd5-470e-bb4e-2dffedbd9963'
const testViewId = '82a0d4b1-6c60-4a0a-a019-2f9f44416c49'
const testDisplayName = 'Test Camera Display Name'
const testClientIntegratorId = 'TestClientIntegratorId'
const testSiteIntegratorId = 'TestSiteIntegratorId'
const testCameraIntegratorId = 'TestCameraIntegratorId'

const validRequestParams = {
  clientIntegratorId: testClientIntegratorId,
  siteIntegratorId: testSiteIntegratorId,
}

const mockSite = {
  calipsaSiteId: testSiteId,
}

const mockCamera = {
  calipsaViewId: testViewId,
  integratorId: testCameraIntegratorId,
  name: testDisplayName,
  snapshotSet: false,
  thermal: false,
}
const mockCameras = [mockCamera]

describe('Request Errors', () => {
  it('Should return not found if the site is not found', async () => {
    // Arrange
    getSiteByIntegratorId.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getCamerasIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(response.statusCode).toBe(404)
    expect(data.errors[0].status).toBe('404')
  })
})

describe('Get all cameras for a site', () => {
  beforeAll(() => {
    getSiteByIntegratorId.mockResolvedValue(mockSite)
    listCameras.mockResolvedValue(mockCameras)
    getAdvancedRulesByViewIds.mockResolvedValue([])
  })

  it('Has the correct response structure.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getCamerasIntegrator(ctx, request, response)
    const { data } = response._getJSONData()

    // Assert
    expect(data).toHaveLength(mockCameras.length)
    expect(data[0]).toMatchObject({
      attributes: expect.objectContaining({
        integratorId: expect.any(String),
        displayName: expect.any(String),
        snapshotSet: expect.any(Boolean),
        thermal: expect.any(Boolean),
      }),
      id: expect.any(String),
      type: 'view',
      links: expect.any(Object),
    })
  })

  it('Should get all cameras.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getCamerasIntegrator(ctx, request, response)
    const { data: cameras } = response._getJSONData()
    const camera = cameras[0]

    // Assert
    expect(camera.id).toBe(testViewId)
    expect(camera.attributes.integratorId).toBe(testCameraIntegratorId)
    expect(camera.attributes.displayName).toBe(testDisplayName)
    expect(camera.attributes.snapshotSet).toBe(false)
    expect(camera.attributes.thermal).toBe(false)
  })

  it('Should add links to the response.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getCamerasIntegrator(ctx, request, response)
    const { data, links } = response._getJSONData()
    const { links: cameraLinks } = data[0]

    // Assert
    expect(cameraLinks).toEqual(
      expect.objectContaining({
        self: `${myBaseUrl}/views/${testViewId}`,
      }),
    )

    expect(links).toEqual(
      expect.objectContaining({
        self: `${myBaseUrl}/integrator/clients/${testClientIntegratorId}/sites/${testSiteIntegratorId}/views`,
      }),
    )
  })
})

describe('Status codes', () => {
  it('Should return the correct status code.', async () => {
    // Arrange
    getSiteByIntegratorId.mockResolvedValue(mockSite)
    listCameras.mockResolvedValue(mockCameras)
    getAdvancedRulesByViewIds.mockResolvedValue([])
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getCamerasIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(200)
  })
})

describe('Get camera failure', () => {
  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    getSiteByIntegratorId.mockResolvedValue(mockSite)
    listCameras.mockImplementation(() => {
      throw new Error('Test Error')
    })

    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getCamerasIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
