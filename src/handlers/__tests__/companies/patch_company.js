import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/update_company', () => ({
  updateCompany: jest.fn(),
  patchCompanyName: jest.fn(() => ({
    updatedCompany: {
      id: 'test-id',
      displayName: 'Test Company',
    },
  })),
}))

const mockCapabilitiesService = {
  getCapabilities: jest.fn(() => []),
}
jest.unstable_mockModule('../../../services', () => ({
  services: {
    Capabilities: mockCapabilitiesService,
  },
}))

const { default: mockHttp } = await import('../utils/mock-http.js')
const { patchOwnCompany } = await import('../../company/index.js')

describe('Patch a company.', () => {
  it.each([
    'Test Company',
    '',
    '   ',
  ])(
    'Accepts valid display names.',
    async (displayName) => {
      // Arrange
      const { ctx, request, response } = mockHttp()
      ctx.request.body = {
        displayName,
      }

      // Act
      await patchOwnCompany(ctx, request, response)

      // Assert
      expect(response.statusCode).toBe(200)
    },
  )

  it.each([
    null,
    undefined,
  ])(
    'Rejects invalid display names.',
    async (displayName) => {
      // Arrange
      const { ctx, request, response } = mockHttp()
      ctx.request.body = {
        displayName,
      }

      // Act
      await patchOwnCompany(ctx, request, response)

      // Assert
      expect(response.statusCode).toBe(400)
    },
  )
})
