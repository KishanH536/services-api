import { jest } from '@jest/globals'

const mockCloser = jest.fn()

jest.unstable_mockModule('../../server', () => ({
  runApi: () => ({
    close: (cb) => {
      mockCloser()
      cb()
    },
  }),
  runPrometheus: () => ({
    close: (cb) => {
      mockCloser()
      cb()
    },
  }),
}))

jest.unstable_mockModule('../../db', () => ({
  initDB: () => ({
    close: mockCloser,
  }),
}))

const { startDb } = await import('../db')
const { startCapabilities } = await import('../capabilities')
const { startApi, startPrometheus } = await import('../http_server')

describe('Start and stop services', () => {
  beforeEach(() => {
    mockCloser.mockClear()
  })

  it.each([startDb, startCapabilities, startApi, startPrometheus])(
    'Should start the services',
    async (starter) => {
      const services = {}
      const { service } = await starter(services)
      expect(service).toBeDefined()
    },
  )

  it.each([startDb, startApi, startPrometheus])(
    'Should stop the services',
    async (starter) => {
      const { stop } = await starter()
      await stop()
      expect(mockCloser.mock.calls.length).toBe(1)
    },
  )
})
