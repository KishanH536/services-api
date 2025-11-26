import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/find_or_create_site', () => ({
  createSite: jest.fn(),
}))

jest.unstable_mockModule('../../../core/get_project', () => ({
  default: jest.fn(),
}))

const {
  MY_BASE_URL_FOR_LINKS: myBaseUrl,
} = await import('../../../../config/misc.js')

const { default: addSiteCalipsa } = await import('../../calipsa/add_site.js')
const { default: mockHttp } = await import('../utils/mock-http.js')
const { createSite } = await import('../../../core/find_or_create_site.js')
const { default: getProject } = await import('../../../core/get_project.js')

const testClientId = 'testClientId'
const testSiteName = 'testSiteName'
const testSiteTimeZone = 'Canada/Pacific'

const validRequestParams = {
  clientId: testClientId,
}

const validRequestBody = {
  siteName: testSiteName,
  timeZone: testSiteTimeZone,
}

const mockSite = {
  id: 'testSiteId',
  name: testSiteName,
}

const mockClient = {
  id: 'testClientId',
  name: 'testClientName',
}

describe('Request Errors.', () => {
  it('Should return a 404 if the client does not exist.', async () => {
    // Arrange
    getProject.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addSiteCalipsa(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(404)
  })
})

describe('Add Site.', () => {
  beforeAll(() => {
    getProject.mockResolvedValue(mockClient)
    createSite.mockResolvedValue(mockSite)
  })

  it('Has the correct response structure.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addSiteCalipsa(ctx, request, response)
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

  it('Should add a site.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addSiteCalipsa(ctx, request, response)
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
    expect(displayName).toBe(testSiteName)
    expect(timeZone).toBe(testSiteTimeZone)
    expect(id).toBe(mockSite.id)
  })

  it('Should add links to the response.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addSiteCalipsa(ctx, request, response)
    const {
      data: { links },
    } = response._getJSONData()

    // Assert
    expect(links).toEqual(expect.objectContaining({
      self: `${myBaseUrl}/sites/${mockSite.id}`,
    }))
  })
})

describe('Site creation status codes and location', () => {
  beforeAll(() => {
    getProject.mockResolvedValue(mockClient)
  })

  it(
    'Should always create the site.',
    async () => {
      // Arrange
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      ctx.request.body = validRequestBody

      createSite.mockResolvedValue({
        created: true,
        ...mockSite,
      })

      // Act
      await addSiteCalipsa(ctx, request, response)

      // Assert
      expect(response.statusCode).toBe(201)
    },
  )

  it(
    'Should always add the location header.',
    async () => {
      // Arrange
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      ctx.request.body = validRequestBody

      createSite.mockResolvedValue({
        created: true,
        ...mockSite,
      })

      // Act
      await addSiteCalipsa(ctx, request, response)

      // Assert
      const expectedLocation = `${myBaseUrl}/sites/${mockSite.id}`

      expect(response.getHeader('location')).toBe(expectedLocation)
    },
  )
})

describe('Add site failure', () => {
  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    getProject.mockResolvedValue(mockClient)
    createSite.mockImplementation(() => {
      throw new Error('Test Error')
    })

    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addSiteCalipsa(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
