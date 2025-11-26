import { jest } from '@jest/globals'

const mockLogger = {
  info: jest.fn(),
  fatal: jest.fn(),
}

const mockStop = jest.fn()

jest.unstable_mockModule('../../services/db.js', () => ({
  startDb: jest.fn(() => ({
    service: 'db',
    stop: mockStop,
  })),
}))

jest.unstable_mockModule('../../services/capabilities', () => ({
  startCapabilities: jest.fn(() => ({
    service: 'capabilities',
    stop: mockStop,
  })),
}))

jest.unstable_mockModule('../../services/http_server.js', () => ({
  startApi: jest.fn(() => ({
    service: 'api',
    stop: mockStop,
  })),
  startPrometheus: jest.fn(() => ({
    service: 'prometheus',
    stop: mockStop,
  })),
}))

const { startApi } = await import('../../services/http_server.js')
const { startDb } = await import('../../services/db.js')
const { default: bootstrap } = await import('../index.js')

describe('Bootstrap', () => {
  beforeEach(() => {
    mockLogger.fatal.mockClear()
  })

  it('Should bootstrap the application', async () => {
    const serviceManager = await bootstrap(mockLogger)

    expect(serviceManager.services.DB).toBe('db')
    expect(serviceManager.services.Capabilities).toBe('capabilities')
    expect(serviceManager.services.API).toBe('api')
    expect(serviceManager.services.Prometheus).toBe('prometheus')
  })

  it('Should handle errors during bootstrap', async () => {
    startDb.mockImplementationOnce(() => {
      throw new Error('test')
    })

    await bootstrap(mockLogger)
    expect(mockLogger.fatal.mock.calls).toHaveLength(1)
  })

  it('Should shut down initialized services after error', async () => {
    mockStop.mockClear()
    startApi.mockImplementationOnce(() => {
      throw new Error('test')
    })

    await bootstrap(mockLogger)
    expect(mockLogger.fatal.mock.calls).toHaveLength(1)
    expect(mockStop).toHaveBeenCalled()
  })
})
