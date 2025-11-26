import { jest } from '@jest/globals'
import { MulterError } from 'multer'

// Mocks
const next = jest.fn()
const sampleInput = '{"hello": "world"}'

const defaultParseFormData = (req, _res, cb) => {
  req.body = { options: sampleInput }
  cb()
}

const mockMulterMiddleware = jest.fn().mockImplementation(defaultParseFormData)

jest.unstable_mockModule('multer', () => {
  const multerFn = jest.fn().mockImplementation(() => ({
    none: () => mockMulterMiddleware,
    fields: () => mockMulterMiddleware,
  }))
  multerFn.memoryStorage = jest.fn()
  return {
    default: multerFn,
    MulterError,
  }
})

jest.unstable_mockModule('../../common/error_response', () => ({
  error400: jest.fn(),
}))

const { default: getMultipartMiddleware } = await import('../multipart_formdata.js')
const { error400 } = await import('../../common/error_response.js')

// Tests
describe('Process Multipart', () => {
  beforeEach(() => {
    next.mockClear()
  })

  it('should call next after processing with images', () => {
    // Arrange
    const request = {}

    // Act
    const multipartProcessor = getMultipartMiddleware({
      imageFields: ['alarmImages'],
    })
    multipartProcessor(request, {}, next)

    // Assert
    expect(next).toHaveBeenCalled()
  })

  it('should call next after processing without images', () => {
    // Arrange
    const request = {}

    // Act
    const multipartProcessor = getMultipartMiddleware({})
    multipartProcessor(request, {}, next)

    // Assert
    expect(next).toHaveBeenCalled()
  })

  it('should parse JSON fields', () => {
    // Arrange
    const request = {}
    const expectedOutput = JSON.parse(sampleInput)

    // Act
    const multipartProcessor = getMultipartMiddleware({
      imageFields: ['alarmImages'],
      jsonFields: ['options'],
    })
    multipartProcessor(request, {}, next)

    // Assert
    expect(request.body.options).toEqual(expectedOutput)
  })

  it('should not parse non-JSON fields', () => {
    // Arrange
    const request = {}

    // Act
    const multipartProcessor = getMultipartMiddleware({
      imageFields: ['alarmImages'],
    })
    multipartProcessor(request, {}, next)

    // Assert
    expect(request.body.options).toEqual(sampleInput)
  })

  it('returns a 400 error if JSON field is not parsable', () => {
    // Arrange
    const request = {}
    mockMulterMiddleware.mockImplementationOnce((req, _res, cb) => {
      req.body = { options: 'invalid' }
      cb()
    })

    // Act
    const multipartProcessor = getMultipartMiddleware({
      imageFields: ['alarmImages'],
      jsonFields: ['options'],
    })
    multipartProcessor(request, {}, next)

    // Assert
    expect(error400).toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('returns a 400 error if too many images are uploaded', () => {
    // Arrange
    const request = {
      resume: jest.fn(),
      logger: { error: jest.fn() },
    }
    mockMulterMiddleware.mockImplementationOnce((req, _res, cb) => {
      req.body = { options: sampleInput }
      cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'alarmImages'))
    })

    // Act
    const multipartProcessor = getMultipartMiddleware({
      imageFields: ['alarmImages'],
    })
    multipartProcessor(request, {}, next)

    // Assert
    expect(error400).toHaveBeenCalled()
    expect(request.resume).toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })
})
