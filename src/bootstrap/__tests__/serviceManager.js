import { jest } from '@jest/globals'

import getServiceManager from '../serviceManager.js'

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
}

describe('serviceManager', () => {
  it('Should start services', async () => {
    // Arrange
    const { services, startService } = getServiceManager(mockLogger)
    const mockService = { service: 'my-service' }
    const starter = jest.fn(() => mockService)

    // Act
    await startService('test', starter)

    // Assert
    expect(services.test).toBe('my-service')
  })

  it('Should stop services', async () => {
    // Arrange
    const { shutdown, startService } = getServiceManager(mockLogger)
    const mockService = { stop: jest.fn() }
    const starter = jest.fn(() => mockService)

    // Act
    await startService('test', starter)
    await shutdown()

    // Assert
    expect(mockService.stop.mock.calls).toHaveLength(1)
  })

  it('Handles errors when stop services', async () => {
    // Arrange
    const { shutdown, startService } = getServiceManager(mockLogger)
    const mockService = {
      stop: jest.fn().mockRejectedValue(new Error('test')),
    }
    const starter = jest.fn(() => mockService)

    // Act
    await startService('test', starter)
    await shutdown()

    // Assert
    expect(async () => await shutdown()).not.toThrow()
    expect(mockLogger.error.mock.calls).toHaveLength(1)
  })
})
