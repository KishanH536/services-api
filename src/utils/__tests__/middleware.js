/* eslint no-param-reassign: 0 */

import { jest } from '@jest/globals'

// Mocks
jest.unstable_mockModule('../../common/error_response', () => ({
  error500: jest.fn(),
}))

const {
  wrapMiddleware,
  wrapMiddlewareWithContext,
  chainAsyncMiddlewareWithContext,
} = await import('../middleware.js')

const {
  error500,
} = await import('../../common/error_response.js')

// Helpers
const SAMPLE_VALUE = 'sample value'
const CTX_PROP_NAME = 'ctxProp'
const REQ_PROP_NAME = 'reqProp'

const sampleMiddleware = (req, _res, next) => {
  req[REQ_PROP_NAME] = SAMPLE_VALUE
  next()
}

const sampleMiddlewareWithCtx = (ctx, req, _res, next) => {
  ctx[CTX_PROP_NAME] = SAMPLE_VALUE
  req[REQ_PROP_NAME] = SAMPLE_VALUE
  next()
}

const testHandler = (_ctx, _req, res) => {
  res.status = 200
}

const throwingMiddleware = (/* ctx, req, res, next are all unused */) => {
  throw new Error('Test Error')
}

// Tests

describe('Wrapping middleware', () => {
  it('Runs ctx-style signature middleware before calling the handler', () => {
    // Arrange
    const ctx = {}
    const req = {}
    const res = {}

    const wrappedHandler = wrapMiddlewareWithContext(
      sampleMiddlewareWithCtx,
      testHandler,
    )

    // Act
    wrappedHandler(ctx, req, res)

    // Assert
    expect(ctx.ctxProp).toBe(SAMPLE_VALUE)
    expect(req.reqProp).toBe(SAMPLE_VALUE)
    expect(res.status).toBe(200)
  })

  it('Runs regular-style middleware before calling the handler', () => {
    // Arrange
    const ctx = {}
    const req = {}
    const res = {}

    const wrappedHandler = wrapMiddleware(
      sampleMiddleware,
      testHandler,
    )

    // Act
    wrappedHandler(ctx, req, res)

    // Assert
    expect(ctx.ctxProp).toBeUndefined()
    expect(req.reqProp).toBe(SAMPLE_VALUE)
    expect(res.status).toBe(200)
  })
})

describe('Chain midleware', () => {
  beforeEach(() => {
    error500.mockClear()
  })

  it('Chains middleware in order', async () => {
    // Arrange
    const OTHER_VALUE = 'other value'
    const ctx = {}
    const req = {}
    const res = {}
    const next = jest.fn()

    const testMiddleware = (testCtx, testReq, _testRes, testNext) => {
      testCtx[CTX_PROP_NAME] = OTHER_VALUE
      testReq[REQ_PROP_NAME] = OTHER_VALUE
      testNext()
    }

    // Act
    const chainedMiddleware = chainAsyncMiddlewareWithContext(
      sampleMiddlewareWithCtx,
      testMiddleware,
    )

    await chainedMiddleware(ctx, req, res, next)

    // Assert
    expect(next).toHaveBeenCalled()
    expect(ctx[CTX_PROP_NAME]).toBe(OTHER_VALUE)
    expect(req[REQ_PROP_NAME]).toBe(OTHER_VALUE)
  })

  it('Catches errors in middleware and returns a 500 error', () => {
    // Arrange
    const ctx = {}
    const req = {
      logger: {
        error: jest.fn(),
      },
    }
    const res = {}
    const next = jest.fn()

    // Act
    const chainedMiddleware = chainAsyncMiddlewareWithContext(
      sampleMiddleware,
      throwingMiddleware,
    )

    chainedMiddleware(ctx, req, res, next)

    // Assert
    expect(req.logger.error).toHaveBeenCalled()
    expect(error500).toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('Catches errors in the first middleware and returns a 500 error', () => {
    // Arrange
    const ctx = {}
    const req = {
      logger: {
        error: jest.fn(),
      },
    }
    const res = {}
    const next = jest.fn()

    // Act
    const chainedMiddleware = chainAsyncMiddlewareWithContext(
      throwingMiddleware,
    )

    chainedMiddleware(ctx, req, res, next)

    // Assert
    expect(req.logger.error).toHaveBeenCalled()
    expect(error500).toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })
})
