import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/delete_site', () => ({
  softDeleteSiteById: jest.fn(),
}))

const { default: deleteSiteCalipsa } = await import('../../calipsa/delete_site.js')
const { default: mockHttp } = await import('../utils/mock-http.js')
const { softDeleteSiteById } = await import('../../../core/delete_site.js')

const testSiteId = '13bc11c9-47d0-4b7d-b4c1-d1a11d3566c5'

const validRequestParams = {
  siteId: testSiteId,
}

describe('Delete a site', () => {
  it('Should delete an existing site.', async () => {
    // Arrange
    softDeleteSiteById.mockResolvedValue({
      id: testSiteId,
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteSiteCalipsa(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(204)
  })

  it('Should return 404 if the site is not found or already deleted.', async () => {
    // Arrange
    softDeleteSiteById.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteSiteCalipsa(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(404)
  })
})

describe('Delete site failure', () => {
  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    softDeleteSiteById.mockImplementation(() => {
      throw new Error('Test Error')
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteSiteCalipsa(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
