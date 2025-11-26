import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../utils/check_capabilities', () => ({
  checkFeatureCapabilities: jest.fn(),
}))

jest.unstable_mockModule('../../../core/create_or_update_camera', () => ({
  updateView: jest.fn(),
}))

jest.unstable_mockModule('../../../core/retrieve_camera_data', () => ({
  getView: jest.fn(),
}))

const {
  MY_BASE_URL_FOR_LINKS: myBaseUrl,
} = await import('../../../../config/misc.js')

const { default: updateCamera } = await import('../../calipsa/update_camera.js')
const { default: mockHttp } = await import('../utils/mock-http.js')

const { checkFeatureCapabilities } = await import('../../../utils/check_capabilities.js')
const { updateView } = await import('../../../core/create_or_update_camera.js')
const { getView } = await import('../../../core/retrieve_camera_data.js')

const testViewId = '689bbf78-fb11-460e-bfdf-0fe7750039f5'

const validRequestParams = {
  viewId: testViewId,
}

const validRequestBody = {
  displayName: 'Test Display Name',
}

const mockUpdatedCamera = {
  name: 'Test Display Name',
  calipsaViewId: 'testViewId',
  masks: [],
  snapshotSet: false,
  thermal: false,
  created: true,
}

describe('Integrator company ID should be selected when X-Tenant-ID is set and not when it is not', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Should call checkFeatureCapabilities with the integration partner company ID', async () => {
    getView.mockResolvedValue(mockUpdatedCamera)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody
    request.companyId = 'tenantCompanyId'
    request.integratorCompanyId = 'integratorCompanyId'

    await updateCamera(ctx, request, response)

    expect(checkFeatureCapabilities).toBeCalledWith(
      'integratorCompanyId',
      {
        objectDetection: {
          humanDetection: {},
          vehicleDetection: {},
        },
      },
    )
  })

  it('Should call checkFeatureCapabilities with the tenant company ID', async () => {
    getView.mockResolvedValue(mockUpdatedCamera)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody
    request.companyId = 'tenantCompanyId'

    await updateCamera(ctx, request, response)

    expect(checkFeatureCapabilities).toBeCalledWith(
      'tenantCompanyId',
      {
        objectDetection: {
          humanDetection: {},
          vehicleDetection: {},
        },
      },
    )
  })
})

describe('Request Errors.', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("Should return a 403 when trying to configure features which the company doesn't have a capability for", async () => {
    // Arrange
    getView.mockResolvedValue(mockUpdatedCamera)
    checkFeatureCapabilities.mockResolvedValue({
      valid: false,
      missingCapabilities: ['testCapability'],
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await updateCamera(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(403)
  })

  it("Should return a 404 not found if the view doesn't exist.", async () => {
    // Arrange
    getView.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await updateCamera(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(404)
  })

  it('Should return a 404 not found if the view does not exist.', async () => {
    // Arrange
    getView.mockResolvedValue(mockUpdatedCamera)
    checkFeatureCapabilities.mockResolvedValue({ valid: true })
    updateView.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await updateCamera(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(404)
  })

  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    getView.mockImplementation(() => {
      throw new Error('Test Error')
    })

    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await updateCamera(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})

describe('Camera success update status code', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it(
    'Should return the correct status code if the camera was updated for a non-shared site.',
    async () => {
      // Arrange
      getView.mockResolvedValue(mockUpdatedCamera)
      checkFeatureCapabilities.mockResolvedValue({ valid: true })
      updateView.mockResolvedValue(mockUpdatedCamera)
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      ctx.request.body = validRequestBody

      // Act
      await updateCamera(ctx, request, response)

      // Assert
      expect(response.statusCode).toBe(200)
    },
  )
})

describe('Update camera response checks', () => {
  beforeAll(() => {
    updateView.mockResolvedValue(mockUpdatedCamera)
    checkFeatureCapabilities.mockResolvedValue({ valid: true })
  })

  it('Has the correct response structure.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await updateCamera(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          attributes: expect.objectContaining({
            displayName: expect.any(String),
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

  it('Should add links to the response.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await updateCamera(ctx, request, response)
    const {
      data: { links },
    } = response._getJSONData()

    // Assert
    expect(links).toEqual(expect.objectContaining({
      self: `${myBaseUrl}/views/${mockUpdatedCamera.calipsaViewId}`,
    }))
  })
})
