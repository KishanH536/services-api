import { jest } from '@jest/globals'

jest.unstable_mockModule('../../utils/check_capabilities', () => ({
  checkDetectionCapabilities: jest.fn(),
}))
jest.unstable_mockModule('../../core/process_via_ml', () => ({
  default: jest.fn(),
}))

const { default: convertEmbeddings } = await import('../embeddings/convert.js')
const { checkDetectionCapabilities } = await import('../../utils/check_capabilities.js')
const { default: processViaMl } = await import('../../core/process_via_ml.js')
const { default: mockHttp } = await import('./utils/mock-http.js')

const badReqBody = {
  options: {
    version: {
      supplied: 5,
      requested: 5,
    },
  },
  embeddings: [
    [
      1, 2, 3, 4,
    ],
  ],
}

const goodReqBody = {
  options: {
    version: {
      supplied: 5,
      requested: 6,
    },
  },
  embeddings: [
    [
      1, 2, 3, 4,
    ],
  ],
}

const goodEmbeddings = [
  [
    4, 5, 6, 7,
  ],
]

describe('Convert embeddings.', () => {
  it('Should reject same version numbers', async () => {
    const { ctx, request, response } = mockHttp()
    ctx.request.body = badReqBody

    await convertEmbeddings(ctx, request, response)

    expect(response.statusCode).toBe(400)
  })

  it('Should reject companies without face capability', async () => {
    const { ctx, request, response } = mockHttp()
    ctx.request.body = goodReqBody

    checkDetectionCapabilities.mockResolvedValue({
      valid: false,
    })

    await convertEmbeddings(ctx, request, response)

    expect(response.statusCode).toBe(403)
  })

  it('Should return 500 if ML fetch errors out', async () => {
    const { ctx, request, response } = mockHttp()
    ctx.request.body = goodReqBody

    checkDetectionCapabilities.mockResolvedValue({
      valid: true,
    })
    processViaMl.mockImplementation(() => {
      throw new Error('Test Error')
    })

    await convertEmbeddings(ctx, request, response)

    expect(response.statusCode).toBe(500)
  })

  it('Should convert embeddings if everything checks out', async () => {
    const { ctx, request, response } = mockHttp()
    ctx.request.body = goodReqBody

    checkDetectionCapabilities.mockResolvedValue({
      valid: true,
    })
    processViaMl.mockResolvedValue(goodEmbeddings)

    await convertEmbeddings(ctx, request, response)

    expect(response.statusCode).toBe(200)
  })
})
