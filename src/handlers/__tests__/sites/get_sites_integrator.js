import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/find_project_by_integrator_id', () => ({
  default: jest.fn(),
}))

jest.unstable_mockModule('../../../core/get_sites', () => ({
  getSitesByClientIntegratorId: jest.fn(),
}))

const {
  MY_BASE_URL_FOR_LINKS: myBaseUrl,
} = await import('../../../../config/misc.js')

const { default: getSitesIntegrator } = await import('../../integrator/get_sites.js')
const { default: mockHttp } = await import('../utils/mock-http.js')

const { default: findProjectByIntegratorId } = await import('../../../core/find_project_by_integrator_id.js')
const { getSitesByClientIntegratorId } = await import('../../../core/get_sites.js')

const testClientId = 'b1b6f619-7cd5-470e-bb4e-2dffedbd9963'
const testSiteId = 'f5b6296a-a1bd-4bef-ad7b-89409734ab9b'
const testClientIntegratorId = 'Test Client?Integrator/Id&'
const testClientIntegratorIdEncoded = encodeURIComponent(testClientIntegratorId)
const testSiteIntegratorId = 'Test Site?Integrator/Id&'
const testSiteDisplayName = 'test-site-display-name'
const testSiteTimeZone = 'Canada/Pacific'

const validRequestParams = {
  clientIntegratorId: testClientIntegratorId,
}

const mockProject = {
  id: testClientId,
  integratorId: testClientIntegratorId,
}

const mockSite = {
  calipsaSiteId: testSiteId,
  integratorId: testSiteIntegratorId,
  name: testSiteDisplayName,
  timeZone: testSiteTimeZone,
}

const mockSites = [mockSite]

describe('Request Errors', () => {
  it('Should return not found if the client is not found', async () => {
    // Arrange
    findProjectByIntegratorId.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSitesIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(response.statusCode).toBe(404)
    expect(data.errors[0].status).toBe('404')
  })
})

describe('Get sites', () => {
  beforeAll(() => {
    findProjectByIntegratorId.mockResolvedValue(mockProject)
    getSitesByClientIntegratorId.mockResolvedValue(mockSites)
  })

  it('Has the correct response structure.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSitesIntegrator(ctx, request, response)
    const { data } = response._getJSONData()

    // Assert
    expect(data).toHaveLength(mockSites.length)
    expect(data[0]).toEqual(
      expect.objectContaining({
        attributes: expect.objectContaining({
          integratorId: expect.any(String),
          displayName: expect.any(String),
          timeZone: expect.any(String),
        }),
        id: expect.any(String),
        type: 'site',
      }),
    )
  })

  it('Should get all sites.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSitesIntegrator(ctx, request, response)
    const { data: sites } = response._getJSONData()

    const site = sites[0]

    // Assert
    expect(site.id).toBe(testSiteId)
    expect(site.attributes.integratorId).toBe(testSiteIntegratorId)
    expect(site.attributes.displayName).toBe(testSiteDisplayName)
    expect(site.attributes.timeZone).toBe(testSiteTimeZone)
  })

  it('Should add links to the response.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSitesIntegrator(ctx, request, response)
    const { links } = response._getJSONData()

    // Assert
    expect(links).toEqual(expect.objectContaining({
      self: `${myBaseUrl}/integrator/clients/${testClientIntegratorIdEncoded}/sites`,
    }))
  })

  it('Should return the correct status code.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSitesIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(200)
  })
})

describe('Get client failure', () => {
  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    findProjectByIntegratorId.mockImplementation(() => {
      throw new Error('Test Error')
    })

    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSitesIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
