import { jest } from '@jest/globals'

const mockCheckCapabilities = jest.fn()
jest.unstable_mockModule('../../services', () => ({
  services: {
    Capabilities: {
      checkCapabilities: mockCheckCapabilities,
    },
  },
}))

const { checkFeatureCapabilities } = await import('../check_capabilities.js')

const companyId = 'test-company-id'

describe('Capabilities Check', () => {
  it.each([undefined, null, {}])('Succeeds when no features are requested.', async (emptyRules) => {
    // Act
    const { valid } = await checkFeatureCapabilities(companyId, emptyRules)

    // Assert
    expect(valid).toBe(true)
  })

  it('Returns missing capabilities.', async () => {
    // Arrange
    mockCheckCapabilities.mockResolvedValueOnce({
      valid: false,
      missingCapabilities: ['testCapability'],
    })

    // Act
    const { valid, missingCapabilities } = await checkFeatureCapabilities(
      companyId,
      {
        advancedRules: [
          { faceDetection: {} },
        ],
      },
    )

    // Assert
    expect(valid).toBe(false)
    expect(missingCapabilities).toEqual(['testCapability'])
  })
})
