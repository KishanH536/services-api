import { jest } from '@jest/globals'

jest.unstable_mockModule('sharp', () => ({
  default: jest.fn(),
}))

jest.unstable_mockModule('../../../core/retrieve_camera_data', () => ({
  getView: jest.fn(),
}))

jest.unstable_mockModule('../../../core/create_or_update_camera', () => ({
  updateView: jest.fn(),
}))

jest.unstable_mockModule('../../../core/get_user_sites_permissions', () => ({
  default: jest.fn(),
}))

jest.unstable_mockModule('../../../common/s3', () => ({
  uploadTamperingRef: jest.fn(),
}))

const { default: sharp } = await import('sharp')

const { default: mockHttp } = await import('../utils/mock-http.js')

const { getView: retrieveCameraData } = await import('../../../core/retrieve_camera_data.js')
const { updateView } = await import('../../../core/create_or_update_camera.js')
const { default: getUserSitesPermission } = await import('../../../core/get_user_sites_permissions.js')

const { uploadTamperingRef } = await import('../../../common/s3.js')

const { default: putReferenceImage } = await import('../../sceneChange/put_ref_image.js')

const goodCalipsaPath = '/services/views/viewId/dayReferenceImage'

describe('Request Errors', () => {
  beforeEach(() => {
    sharp.mockReturnValue({
      metadata: jest.fn().mockResolvedValue({
        format: 'jpeg',
        width: 640,
        height: 480,
      }),
    })
  })
  it('Should reject request if no camera found', async () => {
    const { ctx, request, response } = mockHttp()
    ctx.request.path = goodCalipsaPath
    retrieveCameraData.mockResolvedValue(null)
    await putReferenceImage(ctx, request, response)
    expect(response.statusCode).toBe(404)
  })

  it('Should reject request if camera not set for tampering', async () => {
    const { ctx, request, response } = mockHttp()
    ctx.request.path = goodCalipsaPath
    retrieveCameraData.mockResolvedValue({ tampering: false })
    await putReferenceImage(ctx, request, response)
    expect(response.statusCode).toBe(400)
  })

  it('Should reject request if camera fetch throws an error', async () => {
    const { ctx, request, response } = mockHttp()
    ctx.request.path = goodCalipsaPath
    retrieveCameraData.mockImplementation(() => {
      throw new Error('Test Error')()
    })
    await putReferenceImage(ctx, request, response)
    expect(response.statusCode).toBe(500)
  })

  it('Should reject request if sharp throws an error', async () => {
    const { ctx, request, response } = mockHttp()
    ctx.request.path = goodCalipsaPath
    retrieveCameraData.mockResolvedValue({ tampering: true })
    getUserSitesPermission.mockResolvedValue({ permissionId: 'MEMBER_USER' })
    sharp.mockImplementationOnce(() => {
      throw new Error('Test Error')()
    })
    await putReferenceImage(ctx, request, response)
    expect(response.statusCode).toBe(400)
  })

  it('Should reject request if image type is wrong (not either png or jpeg)', async () => {
    const { ctx, request, response } = mockHttp()
    ctx.request.path = goodCalipsaPath
    retrieveCameraData.mockResolvedValue({ tampering: true })
    getUserSitesPermission.mockResolvedValue({ permissionId: 'MEMBER_USER' })
    sharp.mockReturnValueOnce({
      metadata: jest.fn().mockResolvedValue({ format: 'bad_format' }),
    })
    await putReferenceImage(ctx, request, response)
    expect(response.statusCode).toBe(400)
  })

  it('Should reject request if AWS write throws an error', async () => {
    const { ctx, request, response } = mockHttp()
    ctx.request.path = goodCalipsaPath
    retrieveCameraData.mockResolvedValue({
      tampering: true,
      tamperingConfig: {
        day: {},
        night: {},
      },
    })
    getUserSitesPermission.mockResolvedValue({ permissionId: 'MEMBER_USER' })
    uploadTamperingRef.mockImplementation(() => {
      throw new Error('Test Error')()
    })
    updateView.mockResolvedValue({
      good: 'update',
    })
    await putReferenceImage(ctx, request, response)
    expect(response.statusCode).toBe(500)
  })

  it('Should reject request if view update DB write throws an error', async () => {
    const { ctx, request, response } = mockHttp()
    ctx.request.path = goodCalipsaPath
    retrieveCameraData.mockResolvedValue({
      tampering: true,
      tamperingConfig: {
        day: {},
        night: {},
      },
    })
    getUserSitesPermission.mockResolvedValue({ permissionId: 'MEMBER_USER' })
    uploadTamperingRef.mockResolvedValue('6060842')
    updateView.mockImplementation(() => {
      throw new Error('Test Error')()
    })
    await putReferenceImage(ctx, request, response)
    expect(response.statusCode).toBe(500)
  })
})

describe('Good Request', () => {
  it('Should respond with OK (no content) if all parameters are good', async () => {
    const { ctx, request, response } = mockHttp()
    ctx.request.path = goodCalipsaPath
    retrieveCameraData.mockResolvedValue({
      tampering: true,
      tamperingConfig: {
        day: {},
        night: {},
      },
    })
    getUserSitesPermission.mockResolvedValue({ permissionId: 'MEMBER_USER' })
    uploadTamperingRef.mockResolvedValue('6060842')
    updateView.mockResolvedValue({
      good: 'update',
    })
    await putReferenceImage(ctx, request, response)
    expect(response.statusCode).toBe(204)
    expect(response.get('Location')).anyUrl()
  })

  it('Should respond with OK (no content) if all parameters are good', async () => {
    const { ctx, request, response } = mockHttp()
    ctx.request.path = goodCalipsaPath
    retrieveCameraData.mockResolvedValue({
      tampering: true,
      tamperingConfig: {
        day: {},
        night: {},
      },
    })
    getUserSitesPermission.mockResolvedValue({ permissionId: 'MEMBER_USER' })
    uploadTamperingRef.mockResolvedValue('6060842')
    updateView.mockResolvedValue({
      good: 'update',
    })
    await putReferenceImage(ctx, request, response)
    expect(response.statusCode).toBe(204)
  })

  it('Should respond with OK (no content) if all parameters are good and no tamperingConfig set', async () => {
    const { ctx, request, response } = mockHttp()
    ctx.request.path = goodCalipsaPath
    retrieveCameraData.mockResolvedValue({ tampering: true })
    getUserSitesPermission.mockResolvedValue({ permissionId: 'MEMBER_USER' })
    uploadTamperingRef.mockResolvedValue('6060842')
    updateView.mockResolvedValue({
      good: 'update',
    })
    await putReferenceImage(ctx, request, response)
    expect(response.statusCode).toBe(204)
  })
})
