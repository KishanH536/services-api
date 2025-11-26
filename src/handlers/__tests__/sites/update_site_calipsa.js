import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/update_site', () => ({
  default: jest.fn(),
}))

const {
  MY_BASE_URL_FOR_LINKS: myBaseUrl,
} = await import('../../../../config/misc.js')

const { default: updateSiteHandler } = await import('../../calipsa/update_site.js')
const { default: mockHttp } = await import('../utils/mock-http.js')
const { default: updateSite } = await import('../../../core/update_site.js')

const testSiteId = '689bbf78-fb11-460e-bfdf-0fe7750039f5'

const validRequestParams = {
  siteId: testSiteId,
}

const validRequestBody = {
  siteName: 'Test Site Name',
  timeZone: 'America/Vancouver',
}

const mockUpdatedSite = {
  id: 1234,
  name: 'Test Site Name',
  timeZone: 'America/Vancouver',
}

describe('Request Errors.', () => {
  it('Should return a 404 not found if the view does not exist.', async () => {
    // Arrange
    updateSite.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await updateSiteHandler(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(404)
  })

  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    updateSite.mockImplementation(() => {
      throw new Error('Test Error')
    })

    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await updateSiteHandler(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})

describe('Camera success update status code', () => {
  it(
    'Should return the correct status code if the camera was updated.',
    async () => {
      // Arrange
      updateSite.mockResolvedValue(mockUpdatedSite)
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      ctx.request.body = validRequestBody

      // Act
      await updateSiteHandler(ctx, request, response)

      // Assert
      expect(response.statusCode).toBe(200)
    },
  )
})

describe('Update camera response checks', () => {
  beforeAll(() => {
    updateSite.mockResolvedValue(mockUpdatedSite)
  })

  it('Has the correct response structure.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await updateSiteHandler(ctx, request, response)
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

  it('Should add links to the response.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await updateSiteHandler(ctx, request, response)
    const {
      data: { links },
    } = response._getJSONData()

    // Assert
    expect(links).toEqual(expect.objectContaining({
      self: `${myBaseUrl}/sites/${testSiteId}`,
    }))
  })
})
