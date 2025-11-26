import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/delete_project', () => ({
  softDeleteClientByIntegratorId: jest.fn(),
}))

const { default: deleteClientIntegrator } = await import('../../integrator/delete_client.js')
const { default: mockHttp } = await import('../utils/mock-http.js')

const { softDeleteClientByIntegratorId } = await import('../../../core/delete_project.js')

const testClientIntegratorId = 'Test Client?Integrator/Id&'
const testClientId = '13bc11c9-47d0-4b7d-b4c1-d1a11d3566c5'

const validRequestParams = {
  clientIntegratorId: testClientIntegratorId,
}

describe('Delete a client', () => {
  it('Should delete an existing client.', async () => {
    // Arrange
    softDeleteClientByIntegratorId.mockResolvedValue({
      id: testClientId,
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteClientIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(204)
  })

  it('Should return 404 if the client is not found or already deleted.', async () => {
    // Arrange
    softDeleteClientByIntegratorId.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteClientIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(404)
  })
})

describe('Delete client failure', () => {
  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    softDeleteClientByIntegratorId.mockImplementation(() => {
      throw new Error('Test Error')
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteClientIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
