import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../services', () => ({
  services: {
    Capabilities: {
      checkCapabilities: jest.fn(),
    },
  },
}))

jest.unstable_mockModule('../../../core/find_company', () => ({
  getCompanyById: jest.fn(),
}))

const {
  checkCapabilitiesHandler,
  checkParentUserHandler,
} = await import('../../company/checks.js')

const {
  NotFoundError,
  AuthorizationError,
} = await import('../../../common/errors/index.js')

const {
  services: {
    Capabilities: capabilitiesService,
  },
} = await import('../../../services/index.js')

const { getCompanyById } = await import('../../../core/find_company.js')

const { default: mockHttp } = await import('../utils/mock-http.js')

describe('Check capabilities.', () => {
  it('Should pass for a valid capabilities list.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.body = {
      capabilities: ['dummy'],
    }
    capabilitiesService.checkCapabilities.mockResolvedValue({
      valid: true,
    })

    // Act
    const pass = await checkCapabilitiesHandler(ctx, request, response)

    // Assert
    expect(pass).toBe(true)
  })

  it('Should fail if there are missing capabilities.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.body = {
      capabilities: ['missing_capability'],
    }
    capabilitiesService.checkCapabilities.mockResolvedValue({
      valid: false,
      missingCapabilities: ['missing_capability'],
    })

    // Act
    const check = async () => await checkCapabilitiesHandler(ctx, request, response)

    // Assert
    await expect(check).rejects.toThrow(AuthorizationError)
  })
})

describe('Check parent user.', () => {
  it('Should fail if it cannot find the company.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = {
      companyId: 'test-id',
    }
    getCompanyById.mockResolvedValue(null)

    // Act
    const check = async () => await checkParentUserHandler(ctx, request, response)

    // Assert
    await expect(check).rejects.toThrow(NotFoundError)
  })

  it('Should fail if the user company is not the parent of the company in the request.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = {
      companyId: 'test-id',
    }

    getCompanyById.mockResolvedValue({
      createdBy: 'not-the-parent-id',
    })

    // Act
    const check = async () => await checkParentUserHandler(ctx, request, response)

    // Assert
    await expect(check).rejects.toThrow(AuthorizationError)
  })

  it('Should pass if the user company is the parent of the company in the request.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = {
      companyId: 'test-id',
    }

    getCompanyById.mockResolvedValue({
      createdBy: request.auth.userId,
    })

    // Act
    const pass = await checkParentUserHandler(ctx, request, response)

    // Assert
    expect(pass).toBe(true)
  })
})
