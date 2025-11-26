import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/delete_project', () => ({
  softDeleteClientById: jest.fn(),
}))

const { default: deleteClientCalipsa } = await import('../../calipsa/delete_client.js')
const { default: mockHttp } = await import('../utils/mock-http.js')
const { softDeleteClientById } = await import('../../../core/delete_project.js')

const testClientId = '13bc11c9-47d0-4b7d-b4c1-d1a11d3566c5'

const validRequestParams = {
  clientId: testClientId,
}

describe('Delete a client', () => {
  it('Should delete an existing client.', async () => {
    // Arrange
    softDeleteClientById.mockResolvedValue({
      id: testClientId,
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteClientCalipsa(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(204)
  })

  it('Should return 404 if the client is not found or already deleted.', async () => {
    // Arrange
    softDeleteClientById.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteClientCalipsa(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(404)
  })
})

describe('Delete client failure', () => {
  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    softDeleteClientById.mockImplementation(() => {
      throw new Error('Test Error')
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteClientCalipsa(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
