import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/get_site', () => ({
  getSiteByIntegratorId: jest.fn(),
}))

const {
  MY_BASE_URL_FOR_LINKS: myBaseUrl,
} = await import('../../../../config/misc.js')

const { default: getSiteIntegrator } = await import('../../integrator/get_site.js')
const { default: mockHttp } = await import('../utils/mock-http.js')

const { getSiteByIntegratorId: getSite } = await import('../../../core/get_site.js')

const testSiteId = 'b1b6f619-7cd5-470e-bb4e-2dffedbd9963'
const testClientIntegratorId = 'Test Client?Integrator/Id&'
const testSiteIntegratorId = 'Test Site?Integrator/Id&'
const testClientIntegratorIdEncoded = encodeURIComponent(testClientIntegratorId)
const testSiteIntegratorIdEncoded = encodeURIComponent(testSiteIntegratorId)
const testTimeZone = 'Canada/Pacific'

const validRequestParams = {
  clientIntegratorId: testClientIntegratorId,
  siteIntegratorId: testSiteIntegratorId,
}

const mockSite = {
  calipsaSiteId: testSiteId,
  integratorId: testSiteIntegratorId,
  timeZone: testTimeZone,
}

describe('Request Errors', () => {
  it('Should return not found if the site is not found', async () => {
    // Arrange
    getSite.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = {
      clientIntegratorId: testClientIntegratorId,
      siteIntegratorId: 'siteDoesNotExist',
    }

    // Act
    await getSiteIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(response.statusCode).toBe(404)
    expect(data.errors[0].status).toBe('404')
  })
})

describe('Get a site', () => {
  beforeAll(() => {
    getSite.mockResolvedValue(mockSite)
  })

  it('Has the correct response structure.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSiteIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          attributes: expect.objectContaining({
            integratorId: expect.any(String),
            timeZone: expect.any(String),
          }),
          id: testSiteId,
          type: 'site',
          links: expect.any(Object),
        }),
      }),
    )
  })

  it('Should get a site.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSiteIntegrator(ctx, request, response)
    const {
      data: {
        id,
        attributes: {
          integratorId,
          timeZone,
        },
      },
    } = response._getJSONData()

    // Assert
    expect(id).toBe(testSiteId)
    expect(integratorId).toBe(testSiteIntegratorId)
    expect(timeZone).toBe(testTimeZone)
  })

  it('Should add links to the response.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSiteIntegrator(ctx, request, response)
    const {
      data: { links },
    } = response._getJSONData()

    // Assert
    expect(links).toEqual(expect.objectContaining({
      self: `${myBaseUrl}/integrator/clients/${testClientIntegratorIdEncoded}/sites/${testSiteIntegratorIdEncoded}`,
    }))
  })

  it('Should return the correct status code.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSiteIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(200)
  })
})

describe('Get site failure', () => {
  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    getSite.mockImplementation(() => {
      throw new Error('Test Error')
    })

    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSiteIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
