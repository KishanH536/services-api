import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../utils/check_capabilities', () => ({
  checkFeatureCapabilities: jest.fn(),
}))

jest.unstable_mockModule('../../../core/create_or_update_camera', () => ({
  createView: jest.fn(),
}))

jest.unstable_mockModule('../../../core/get_site', () => ({
  getSiteById: jest.fn(),
}))

const {
  MY_BASE_URL_FOR_LINKS: myBaseUrl,
} = await import('../../../../config/misc.js')

const { default: addCamera } = await import('../../calipsa/add_camera.js')
const { default: mockHttp } = await import('../utils/mock-http.js')

const { checkFeatureCapabilities } = await import('../../../utils/check_capabilities.js')
const { createView } = await import('../../../core/create_or_update_camera.js')
const { getSiteById } = await import('../../../core/get_site.js')

const testSiteId = '689bbf78-fb11-460e-bfdf-0fe7750039f5'
const testCameraIntegratorId = 'TestCameraIntegratorId'

const validRequestParams = {
  siteId: testSiteId,
}

const validRequestBody = {
  displayName: 'Test Display Name',
}

const mockCreatedCamera = {
  name: 'testName',
  integratorId: testCameraIntegratorId,
  calipsaViewId: 'testViewId',
  masks: [],
  snapshotSet: false,
  thermal: false,
  created: true,
  advancedRules: [],
}

const mockSite = {
  id: 'testSiteId',
  name: 'testSiteName',
}

describe('Request Errors.', () => {
  it('Should return a 404 not found if the site does not exist.', async () => {
    // Arrange
    getSiteById.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addCamera(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(404)
  })

  it("Should return a 403 when trying to configure features which the company doesn't have a capability for", async () => {
    // Arrange
    getSiteById.mockResolvedValue(mockSite)
    checkFeatureCapabilities.mockResolvedValue({
      valid: false,
      missingCapabilities: ['testCapability'],
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addCamera(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(403)
  })
})

describe('Add camera', () => {
  beforeAll(() => {
    getSiteById.mockResolvedValue(mockSite)
    createView.mockResolvedValue(mockCreatedCamera)
    checkFeatureCapabilities.mockResolvedValue({ valid: true })
  })

  it('Has the correct response structure.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addCamera(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          attributes: expect.objectContaining({
            displayName: expect.any(String),
            integratorId: expect.any(String),
            masks: expect.any(Array),
            snapshotSet: expect.any(Boolean),
            thermal: expect.any(Boolean),
          }),
          id: expect.any(String),
          type: 'view',
          links: expect.any(Object),
        }),
      }),
    )
  })

  it('Should add a camera.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addCamera(ctx, request, response)
    const {
      data: {
        attributes: {
          integratorId,
        },
      },
    } = response._getJSONData()

    // Assert
    expect(integratorId).toBe(testCameraIntegratorId)
  })

  it('Should add links to the response.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addCamera(ctx, request, response)
    const {
      data: { links },
    } = response._getJSONData()

    // Assert
    expect(links).toEqual(expect.objectContaining({
      self: `${myBaseUrl}/views/${mockCreatedCamera.calipsaViewId}`,
    }))
  })
})

describe('Camera creation status codes and location', () => {
  beforeAll(() => {
    getSiteById.mockResolvedValue(mockSite)
    checkFeatureCapabilities.mockResolvedValue({ valid: true })
  })

  it(
    'Should return the correct status code if the camera was created.',
    async () => {
      // Arrange
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      ctx.request.body = validRequestBody

      createView.mockResolvedValue(mockCreatedCamera)

      // Act
      await addCamera(ctx, request, response)

      // Assert
      expect(response.statusCode).toBe(201)
    },
  )

  it(
    'Should add the location header if the camera was created.',
    async () => {
      // Arrange
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      ctx.request.body = validRequestBody

      createView.mockResolvedValue(mockCreatedCamera)

      // Act
      await addCamera(ctx, request, response)

      // Assert
      const expectedLocation = `${myBaseUrl}/views/${mockCreatedCamera.calipsaViewId}`
      expect(response.getHeader('location')).toBe(expectedLocation)
    },
  )
})

describe('Add camera failure', () => {
  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    getSiteById.mockResolvedValue(mockSite)
    createView.mockImplementation(() => {
      throw new Error('Test Error')
    })

    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addCamera(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
