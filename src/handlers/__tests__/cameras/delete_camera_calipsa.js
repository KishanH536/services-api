import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/delete_camera', () => ({
  softDeleteCameraById: jest.fn(),
  softDeleteSharedCameraById: jest.fn(),
}))

const { default: deleteCameraCalipsa } = await import('../../calipsa/delete_camera.js')
const { default: mockHttp } = await import('../utils/mock-http.js')
const {
  softDeleteCameraById,
  softDeleteSharedCameraById,
} = await import('../../../core/delete_camera.js')

const testViewId = 'b51af614-1561-4ebb-a883-aaf229c971a4'

const validRequestParams = {
  viewId: testViewId,
}

describe('Delete a camera', () => {
  it('Should delete an existing camera for non-shared site.', async () => {
    // Arrange
    softDeleteCameraById.mockResolvedValue({
      id: testViewId,
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteCameraCalipsa(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(204)
  })

  it('Should delete an existing camera for shared site.', async () => {
    // Arrange
    softDeleteCameraById.mockResolvedValue(null)
    softDeleteSharedCameraById.mockResolvedValue({
      id: testViewId,
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteCameraCalipsa(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(204)
  })

  it('Should return 404 if the camera is not found or already deleted.', async () => {
    // Arrange
    softDeleteCameraById.mockResolvedValue(null)
    softDeleteSharedCameraById.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteCameraCalipsa(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(404)
  })
})

describe('Delete camera failure', () => {
  it('Should send an internal server error if the handler for a non-shared site errors.', async () => {
    // Arrange
    softDeleteCameraById.mockImplementation(() => {
      throw new Error('Test Error')
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteCameraCalipsa(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })

  it('Should send an internal server error if the handler for a shared site errors.', async () => {
    // Arrange
    softDeleteCameraById.mockResolvedValue(null)
    softDeleteSharedCameraById.mockImplementation(() => {
      throw new Error('Test Error')
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await deleteCameraCalipsa(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
