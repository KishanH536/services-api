import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/site_from_company', () => ({
  default: jest.fn(),
}))

jest.unstable_mockModule('../../../utils/get_shared_site', () => ({
  default: jest.fn(),
}))

jest.unstable_mockModule('../../../core/list_cameras', () => ({
  listCameras: jest.fn(),
  listSharedCameras: jest.fn(),
}))

jest.unstable_mockModule('../../../core/get_advanced_rules', () => ({
  getAdvancedRulesByViewIds: jest.fn(),
}))

const { View } = await import('../../../api/serializers/index.js')
const { default: getCamerasCalipsa } = await import('../../calipsa/get_cameras.js')
const { default: mockHttp } = await import('../utils/mock-http.js')

const { default: siteFromCompany } = await import('../../../core/site_from_company.js')
const { default: getSharedSite } = await import('../../../utils/get_shared_site.js')
const { listCameras, listSharedCameras } = await import('../../../core/list_cameras.js')
const { getAdvancedRulesByViewIds } = await import('../../../core/get_advanced_rules.js')

const testSiteId = 'b1b6f619-7cd5-470e-bb4e-2dffedbd9963'
const testUserId = 'e834887a-7119-4f34-8584-f8bcbcce254b'
const testCompanyId = '1ab96e0d-bcc1-4e76-9dc1-834221266fb0'
const testViewId = '82a0d4b1-6c60-4a0a-a019-2f9f44416c49'
const testDisplayName = 'Test Camera Display Name'
const testCameraIntegratorId = 'TestCameraIntegratorId'

const validRequestParams = {
  siteId: testSiteId,
}

const mockSharedSite = {
  siteId: testSiteId,
  userId: testUserId,
  companyId: testCompanyId,
}

const mockCamera = {
  calipsaViewId: testViewId,
  integratorId: testCameraIntegratorId,
  name: testDisplayName,
  snapshotSet: false,
  thermal: false,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
}

const mockCameraWithSnapshot = {
  calipsaViewId: testViewId,
  integratorId: testCameraIntegratorId,
  name: testDisplayName,
  snapshotSet: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  thermal: false,
}

const mockCameras = [mockCamera]

describe('Request Errors', () => {
  it('Should return not found if the site is not found', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    siteFromCompany.mockResolvedValue(false)
    getSharedSite.mockResolvedValue(null)

    // Act
    await getCamerasCalipsa(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(response.statusCode).toBe(404)
    expect(data.errors[0].status).toBe('404')
  })
})

describe('Get all cameras for a site', () => {
  beforeAll(() => {
    getAdvancedRulesByViewIds.mockResolvedValue([])
  })

  it('Has the correct response structure.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    siteFromCompany.mockResolvedValue(true)
    listCameras.mockResolvedValue(mockCameras)
    const expectedResponseBody = View.render(mockCameras, testSiteId)

    // Act
    await getCamerasCalipsa(ctx, request, response)
    const responseBody = response._getJSONData()
    const dataArray = responseBody.data

    // Assert
    expect(dataArray).toHaveLength(mockCameras.length)
    expect(responseBody).toMatchObject(expectedResponseBody)
  })

  it('Has the correct response structure with link to snapshot.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    siteFromCompany.mockResolvedValue(true)
    listCameras.mockResolvedValue([mockCameraWithSnapshot])
    const expectedResponseBody = View.render([mockCameraWithSnapshot], testSiteId)

    // Act
    await getCamerasCalipsa(ctx, request, response)
    const responseBody = response._getJSONData()
    const dataArray = responseBody.data

    // Assert
    expect(dataArray).toHaveLength([mockCameraWithSnapshot].length)
    expect(responseBody).toMatchObject(expectedResponseBody)
  })

  it('Should get all cameras for a non-shared site.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    siteFromCompany.mockResolvedValue(true)
    listCameras.mockResolvedValue(mockCameras)

    // Act
    await getCamerasCalipsa(ctx, request, response)
    const { data: cameras } = response._getJSONData()
    const camera = cameras[0]

    // Assert
    expect(camera.id).toBe(testViewId)
    expect(camera.attributes.integratorId).toBe(testCameraIntegratorId)
    expect(camera.attributes.displayName).toBe(testDisplayName)
    expect(camera.attributes.snapshotSet).toBe(false)
    expect(camera.attributes.thermal).toBe(false)
  })

  it('Should get all cameras for a shared site.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    siteFromCompany.mockResolvedValue(false)
    getSharedSite.mockResolvedValue(mockSharedSite)
    listSharedCameras.mockResolvedValue(mockCameras)

    // Act
    await getCamerasCalipsa(ctx, request, response)
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
    siteFromCompany.mockResolvedValue(true)
    listCameras.mockResolvedValue(mockCameras)
    const expectedResponseBody = View.render(mockCameras, testSiteId)

    // Act
    await getCamerasCalipsa(ctx, request, response)
    const responseBody = response._getJSONData()
    const { links } = responseBody

    // Assert
    expect(links).toEqual(expectedResponseBody.links)
  })

  it('Should add a snapshot link to the response.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    siteFromCompany.mockResolvedValue(true)
    listCameras.mockResolvedValue([mockCameraWithSnapshot])

    // Act
    await getCamerasCalipsa(ctx, request, response)
    const responseBody = response._getJSONData()
    const { links } = responseBody.data[0]

    // Assert
    expect(links).toEqual(expect.objectContaining({
      'http://calipsa.io/relation/current-image': `/views/${testViewId}/snapshot`,
    }))
  })
})

describe('Status codes', () => {
  it('Should return the correct status code for a non-shared site.', async () => {
    // Arrange
    siteFromCompany.mockResolvedValue(true)
    listCameras.mockResolvedValue(mockCameras)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getCamerasCalipsa(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(200)
  })

  it('Should return the correct status code for a shared site.', async () => {
    // Arrange
    siteFromCompany.mockResolvedValue(false)
    getSharedSite.mockResolvedValue(mockSharedSite)
    listSharedCameras.mockResolvedValue(mockCameras)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getCamerasCalipsa(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(200)
  })
})

describe('Get camera failure', () => {
  it('Should send an internal server error if the listCameras function errors.', async () => {
    // Arrange
    siteFromCompany.mockResolvedValue(true)
    listCameras.mockImplementation(() => {
      throw new Error('Test Error')
    })

    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getCamerasCalipsa(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })

  it('Should send an internal server error if the listSharedCameras function errors.', async () => {
    // Arrange
    siteFromCompany.mockResolvedValue(false)
    getSharedSite.mockResolvedValue(mockSharedSite)
    listSharedCameras.mockImplementation(() => {
      throw new Error('Test Error')
    })

    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getCamerasCalipsa(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
