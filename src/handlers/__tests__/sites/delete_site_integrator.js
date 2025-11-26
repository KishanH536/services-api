import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/delete_site', () => ({
  softDeleteSiteByIntegratorId: jest.fn(),
}))

const { default: deleteSiteIntegrator } = await import('../../integrator/delete_site.js')
const { default: mockHttp } = await import('../utils/mock-http.js')
const { softDeleteSiteByIntegratorId } = await import('../../../core/delete_site.js')

const testClientIntegratorId = 'Test Client?Integrator/Id&'
const testSiteIntegratorId = 'Test Site?Integrator/Id&'
const testSiteId = '13bc11c9-47d0-4b7d-b4c1-d1a11d3566c5'

const validRequestParams = {
  clientIntegratorId: testClientIntegratorId,
  siteIntegratorId: testSiteIntegratorId,
}

describe('Delete a site', () => {
  it('Should delete an existing site.', async () => {
    // Arrange
    softDeleteSiteByIntegratorId.mockResolvedValue({
      id: testSiteId,
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteSiteIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(204)
  })

  it('Should return 404 if the site is not found or already deleted.', async () => {
    // Arrange
    softDeleteSiteByIntegratorId.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteSiteIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(404)
  })
})

describe('Delete site failure', () => {
  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    softDeleteSiteByIntegratorId.mockImplementation(() => {
      throw new Error('Test Error')
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteSiteIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
