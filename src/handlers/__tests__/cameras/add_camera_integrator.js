import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/find_or_create_project', () => ({
  findOrCreateProject: jest.fn(),
}))

jest.unstable_mockModule('../../../core/find_or_create_site', () => ({
  findOrCreateSite: jest.fn(),
}))

jest.unstable_mockModule('../../../utils/check_capabilities', () => ({
  checkFeatureCapabilities: jest.fn(),
}))

jest.unstable_mockModule('../../../core/create_or_update_camera', () => ({
  createView: jest.fn(),
  updateView: jest.fn(),
}))

jest.unstable_mockModule('../../../core/retrieve_camera_data', () => ({
  getView: jest.fn(),
}))

const { default: addCamera } = await import('../../integrator/add_camera.js')
const { default: mockHttp } = await import('../utils/mock-http.js')
const { findOrCreateProject } = await import('../../../core/find_or_create_project.js')
const { findOrCreateSite } = await import('../../../core/find_or_create_site.js')
const { checkFeatureCapabilities } = await import('../../../utils/check_capabilities.js')
const { createView, updateView } = await import('../../../core/create_or_update_camera.js')
const { getView: retrieveCameraData } = await import('../../../core/retrieve_camera_data.js')
const {
  MY_BASE_URL_FOR_LINKS: myBaseUrl,
} = await import('../../../../config/misc.js')

const testClientIntegratorId = 'Test Client?Integrator/Id&'
const testSiteIntegratorId = 'Test Site?Integrator/Id&'
const testCameraIntegratorId = 'Test Camera?Integrator/Id&'
const testCameraIntegratorIdEncoded = encodeURIComponent(testCameraIntegratorId)

const validRequestParams = {
  clientIntegratorId: testClientIntegratorId,
  siteIntegratorId: testSiteIntegratorId,
  cameraIntegratorId: testCameraIntegratorId,
}

const mockProject = {
  id: 'testProjectId',
  name: 'TestClientName',
}

const mockSite = {
  id: 'testSiteId',
  name: 'TestClientName',
}

const mockCreatedCamera = {
  name: 'testName',
  integratorId: testCameraIntegratorId,
  calipsaViewId: 'testViewId',
  masks: [],
  snapshotSet: false,
  thermal: false,
}

describe('Request Errors.', () => {
  it("Should return a 403 when trying to configure features which the company doesn't have a capability for", async () => {
    // Arrange
    findOrCreateProject.mockResolvedValue(mockProject)
    findOrCreateSite.mockResolvedValue(mockSite)
    checkFeatureCapabilities.mockResolvedValue({
      valid: false,
      missingCapabilities: ['testCapability'],
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await addCamera(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(403)
  })
})

describe('Add camera', () => {
  beforeAll(() => {
    findOrCreateProject.mockResolvedValue(mockProject)
    findOrCreateSite.mockResolvedValue(mockSite)
    checkFeatureCapabilities.mockResolvedValue({ valid: true })
    retrieveCameraData.mockResolvedValue(mockCreatedCamera)
    createView.mockResolvedValue(mockCreatedCamera)
    updateView.mockResolvedValue(mockCreatedCamera)
  })

  it('Has the correct response structure.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

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
            thermal: false,
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
    retrieveCameraData.mockResolvedValue(null)

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

  it.each(['testDisplayName', undefined])(
    'Should use the camera integrator ID for the name if displayName is not provided.',
    async (displayName) => {
      // Arrange
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      ctx.request.body = {
        displayName,
      }
      retrieveCameraData.mockResolvedValue(null)

      // Act
      await addCamera(ctx, request, response)

      const { viewName } = createView.mock.lastCall[2]

      // Assert
      expect(viewName).toBe(displayName ?? testCameraIntegratorId)
    },
  )

  it('Should add links to the response.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await addCamera(ctx, request, response)
    const {
      data: { links },
    } = response._getJSONData()

    // Assert
    expect(links).toEqual(expect.objectContaining({
      self: `${myBaseUrl}/integrator/views/${testCameraIntegratorIdEncoded}`,
    }))
  })
})

describe('Camera creation status codes and location', () => {
  beforeAll(() => {
    findOrCreateProject.mockResolvedValue(mockProject)
    findOrCreateSite.mockResolvedValue(mockSite)
  })

  it.each([true, false])(
    'Should return the correct status code if the camera was created.',
    async (created) => {
      // Arrange
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      retrieveCameraData.mockResolvedValue(created ? null : mockCreatedCamera)

      createView.mockResolvedValue({
        created: true,
        ...mockCreatedCamera,
      })

      updateView.mockResolvedValue({
        created: false,
        ...mockCreatedCamera,
      })

      // Act
      await addCamera(ctx, request, response)

      // Assert
      expect(response.statusCode).toBe(created ? 201 : 200)
    },
  )

  it.each([true, false])(
    'Should add the location header if the camera was created.',
    async (created) => {
      // Arrange
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      retrieveCameraData.mockResolvedValue(created ? null : mockCreatedCamera)

      createView.mockResolvedValue({
        created: true,
        ...mockCreatedCamera,
      })

      updateView.mockResolvedValue({
        created: false,
        ...mockCreatedCamera,
      })

      // Act
      await addCamera(ctx, request, response)

      // Assert
      const expectedLocation = created ? `${myBaseUrl}/integrator/views/${testCameraIntegratorIdEncoded}` : undefined
      expect(response.getHeader('location')).toBe(expectedLocation)
    },
  )
})

describe('Add camera failure', () => {
  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    findOrCreateProject.mockResolvedValue(mockProject)
    findOrCreateSite.mockResolvedValue(mockSite)
    checkFeatureCapabilities.mockResolvedValue({ valid: true })
    retrieveCameraData.mockImplementation(() => {
      throw new Error('Test Error')
    })

    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await addCamera(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
