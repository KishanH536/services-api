import { jest } from '@jest/globals'
import httpMocks from 'node-mocks-http'

// mocks
const next = jest.fn()

jest.unstable_mockModule('../../../utils/check_capabilities', () => ({
  checkDetectionCapabilities: jest.fn(),
}))

const { default: checkCapabilities } = await import('../middleware/capabilities.js')
const { checkDetectionCapabilities } = await import('../../../utils/check_capabilities.js')

const ctx = {
  detections: {
    other: 'none',
  },
  options: {
    sceneChange: {}, // `force`, `perform` props are set in each test.
  },
}

const req = {
  company: {
    id: 'company',
  },
  integratorCompany: {
    id: 'integrator',
  },
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}

describe('Confirm selection of integrator company ID vs tenant company ID', () => {
  beforeEach(() => {
    checkDetectionCapabilities.mockClear()
  })

  it('Should select integrator ID if one is present', async () => {
    ctx.options.sceneChange.force = false
    req.integratorCompany.id = 'integrator'

    checkDetectionCapabilities.mockResolvedValue({ valid: true })
    await checkCapabilities(ctx, req, null, next)

    expect(checkDetectionCapabilities).toHaveBeenCalledWith('integrator', { other: 'none' })
  })

  it('Should select tenant ID if no integration partner present', async () => {
    ctx.options.sceneChange.force = false
    req.integratorCompany.id = null

    checkDetectionCapabilities.mockResolvedValue({ valid: true })
    await checkCapabilities(ctx, req, null, next)

    expect(checkDetectionCapabilities).toHaveBeenCalledWith('company', { other: 'none' })
  })

  it('Should select integrator ID if one is present (tampering)', async () => {
    ctx.options.sceneChange.force = true
    ctx.options.sceneChange.perform = true
    req.integratorCompany.id = 'integrator'

    checkDetectionCapabilities.mockResolvedValue({ valid: true })
    await checkCapabilities(ctx, req, null, next)

    expect(checkDetectionCapabilities).toBeCalledTimes(2)
    expect(checkDetectionCapabilities).toHaveBeenCalledWith('integrator', { other: 'none' })
  })

  it('Should select tenant ID if no integration partner present', async () => {
    ctx.options.sceneChange.force = true
    ctx.options.sceneChange.perform = true
    req.integratorCompany.id = null

    checkDetectionCapabilities.mockResolvedValue({ valid: true })
    await checkCapabilities(ctx, req, null, next)

    expect(checkDetectionCapabilities).toBeCalledTimes(2)
    expect(checkDetectionCapabilities).toHaveBeenCalledWith('company', { other: 'none' })
  })
})

describe('Handle error conditions properly', () => {
  beforeEach(() => {
    checkDetectionCapabilities.mockClear()
  })

  it('Should return a 403 if capabilities are missing', async () => {
    ctx.options.sceneChange.force = false
    req.integratorCompany.id = 'integrator'

    checkDetectionCapabilities.mockResolvedValue({ valid: false })
    const res = httpMocks.createResponse()

    await checkCapabilities(ctx, req, res, next)
    expect(res.statusCode).toEqual(403)
  })

  it('Should return 500 if an error occurs checking capabilities', async () => {
    ctx.options.sceneChange.force = false
    req.integratorCompany.id = 'integrator'

    checkDetectionCapabilities.mockImplementation(() => {
      throw new Error('Test error')
    })
    const res = httpMocks.createResponse()

    await checkCapabilities(ctx, req, res, next)
    expect(res.statusCode).toEqual(500)
  })

  it('Should set the ctx object if the tampering capabilities fail', async () => {
    ctx.options.sceneChange.force = true
    ctx.options.sceneChange.perform = true
    req.integratorCompany.id = null

    checkDetectionCapabilities
      .mockResolvedValueOnce({ valid: true })
      .mockResolvedValueOnce({ valid: false })

    await checkCapabilities(ctx, req, null, next)
    expect(ctx.detections.tampering.withChecks.notEligible).toEqual({ companyId: 'company' })
  })

  it('Should return 500 if an error occurs checking tampering capabilities', async () => {
    ctx.options.sceneChange.force = true
    ctx.options.sceneChange.perform = true
    req.integratorCompany.id = 'integrator'

    checkDetectionCapabilities.mockImplementation(() => {
      throw new Error('Test error')
    })
    const res = httpMocks.createResponse()

    await checkCapabilities(ctx, req, res, next)
    expect(res.statusCode).toEqual(500)
  })
})
