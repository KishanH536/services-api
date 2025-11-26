import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/delete_camera', () => ({
  softDeleteCameraByIntegratorId: jest.fn(),
}))

const { default: deleteCameraIntegrator } = await import('../../integrator/delete_camera.js')
const { default: mockHttp } = await import('../utils/mock-http.js')
const { softDeleteCameraByIntegratorId } = await import('../../../core/delete_camera.js')

const testViewIntegratorId = 'Test Camera?Integrator/Id&'

const validRequestParams = {
  cameraIntegratorId: testViewIntegratorId,
}

describe('Delete a camera', () => {
  it('Should delete an existing camera.', async () => {
    // Arrange
    softDeleteCameraByIntegratorId.mockResolvedValue({
      id: testViewIntegratorId,
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteCameraIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(204)
  })

  it('Should return 404 if the camera is not found or already deleted.', async () => {
    // Arrange
    softDeleteCameraByIntegratorId.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteCameraIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(404)
  })
})

describe('Delete camera failure', () => {
  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    softDeleteCameraByIntegratorId.mockImplementation(() => {
      throw new Error('Test Error')
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteCameraIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
