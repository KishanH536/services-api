import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/get_site', () => ({
  getSiteById: jest.fn(),
}))

const {
  MY_BASE_URL_FOR_LINKS: myBaseUrl,
} = await import('../../../../config/misc.js')

const { default: getSiteCalipsa } = await import('../../calipsa/get_site.js')
const { default: mockHttp } = await import('../utils/mock-http.js')

const { getSiteById: getSite } = await import('../../../core/get_site.js')

const testProjectId = 'f773d574-8b52-4d00-b6c0-770df9955b97'
const testSiteId = 'b1b6f619-7cd5-470e-bb4e-2dffedbd9963'
const testSiteDisplayName = 'Test Site Display Name'
const testTimeZone = 'Canada/Pacific'

const validRequestParams = {
  siteId: testSiteId,
}

const mockSite = {
  calipsaSiteId: testSiteId,
  name: testSiteDisplayName,
  timeZone: testTimeZone,
  projectId: testProjectId,
}

describe('Request Errors', () => {
  it('Should return not found if the site is not found', async () => {
    // Arrange
    getSite.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSiteCalipsa(ctx, request, response)
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
    await getSiteCalipsa(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          attributes: expect.objectContaining({
            displayName: expect.any(String),
            timeZone: expect.any(String),
          }),
          id: expect.any(String),
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
    await getSiteCalipsa(ctx, request, response)
    const {
      data: {
        id,
        attributes: {
          displayName,
          timeZone,
        },
      },
    } = response._getJSONData()

    // Assert
    expect(id).toBe(testSiteId)
    expect(displayName).toBe(testSiteDisplayName)
    expect(timeZone).toBe(testTimeZone)
  })

  it('Should add links to the response.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSiteCalipsa(ctx, request, response)
    const {
      data: { links },
    } = response._getJSONData()

    // Assert
    expect(links).toEqual(expect.objectContaining({
      self: `${myBaseUrl}/sites/${testSiteId}`,
    }))
  })

  it('Should return the correct status code.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSiteCalipsa(ctx, request, response)

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
    await getSiteCalipsa(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
