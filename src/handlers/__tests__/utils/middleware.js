import { jest } from '@jest/globals'

// Mock Logging
const createMockPino = () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  child: () => createMockPino(),
})

const mockPino = () => createMockPino()
jest.unstable_mockModule('pino', () => ({
  default: mockPino,
}))
const { default: attachLogger } = await import('../../../middleware/attach_logger.js')

const tokenValidator = (req, res, next) => {
  req.auth = { userId: 'aabf9fd6-0ace-412a-8f27-83dcda33b762' }
  next()
}

const validateUser = (req, res, next) => {
  req.companyId = '0bff2126-165a-44b9-8e5b-747b1556be4e'
  req.company = {}
  next()
}

// Mock middleware:
const next = jest.fn()

const useMiddleware = (req, res) => {
  // Loggers:
  const [
    attachRequestLogger,
    logResponseErrors,
    logIncomingRequest,
  ] = attachLogger

  attachRequestLogger(req, res, next)
  logResponseErrors(req, res, next)
  logIncomingRequest(req, res, next)

  // Auth
  tokenValidator(req, res, next)

  validateUser(req, res, next)
}

export default useMiddleware
