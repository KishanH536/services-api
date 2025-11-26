import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../common/error_response', () => ({
  error400: jest.fn(),
  error401: jest.fn(),
  error403: jest.fn(),
  error404: jest.fn(),
  error500: jest.fn(),
}))

jest.unstable_mockModule('../../../services', () => ({
  services: {
    Capabilities: {
      checkCapabilities: jest.fn(),
    },
  },
}))

jest.unstable_mockModule('../check_permissions', () => ({
  companyPermission: {
    hasAll: jest.fn(),
  },
}))

const {
  default: mockHttp,
} = await import('../../__tests__/utils/mock-http.js')

const {
  error403,
} = await import('../../../common/error_response.js')

const {
  services: {
    Capabilities: capabilitiesService,
  },
} = await import('../../../services/index.js')

const { companyPermission } = await import('../check_permissions.js')
const { createCompany } = await import('../index.js')

describe('Create company checks', () => {
  it('Sets the status exactly once for many failed checks.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    companyPermission.hasAll.mockResolvedValueOnce(false)
    capabilitiesService.checkCapabilities.mockResolvedValueOnce(false)

    // Act
    await createCompany(ctx, request, response)

    // Assert
    expect(error403.mock.calls).toHaveLength(1)
  })
})
