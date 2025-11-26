import { jest } from '@jest/globals'

jest.unstable_mockModule('../on_demand', () => ({
  setOnDemandSceneChange: jest.fn(),
}))

jest.unstable_mockModule('../check', () => ({
  checkTampering: jest.fn(),
}))

jest.unstable_mockModule('../references', () => ({
  setReferenceImage: jest.fn(),
  maybeSaveMissingReference: jest.fn(),
}))

jest.unstable_mockModule('../../../../../core/create_tampering_event', () => ({
  default: jest.fn(),
}))

const {
  setOnDemandSceneChange,
} = await import('../on_demand.js')

const {
  checkTampering,
} = await import('../check/index.js')

const {
  skipReferenceImage,
  noReferences,
  proceed,
} = await import('../payloads.js')

const {
  setReferenceImage,
  maybeSaveMissingReference,
} = await import('../references.js')

const { default: writeTamperingEvent } = await import('../../../../../core/create_tampering_event.js')

const {
  configureTampering,
} = await import('../index.js')

const next = jest.fn()

const getDefaultContext = () => ({
  detections: {},
  options: {
    sceneChange: {
      force: false,
      perform: false,
    },
  },
  cameraData: {},
  imageBuffers: [Buffer.from('')],
})

const getDefaultRequest = () => ({
  company: {
    id: 'company',
    tamperingConfig: {},
  },
  guid: 'my-uuid',
})

describe('Scene Change Configuration', () => {
  beforeEach(() => {
    next.mockClear()
    setOnDemandSceneChange.mockClear()
    checkTampering.mockClear()
    checkTampering.mockResolvedValue({ withChecks: {} })
    setReferenceImage.mockClear()
    maybeSaveMissingReference.mockClear()
    writeTamperingEvent.mockClear()
  })

  it.each([true, false])(
    'Configures on-demand scene change if the option is set',
    async (forceSceneChange) => {
      const ctx = getDefaultContext()
      const req = getDefaultRequest()
      ctx.options.sceneChange.force = forceSceneChange

      await configureTampering(ctx, req, {}, next)

      expect(setOnDemandSceneChange).toBeCalledTimes(forceSceneChange ? 1 : 0)
      expect(checkTampering).toBeCalledTimes(forceSceneChange ? 0 : 1)
      expect(next).toBeCalledTimes(1)
    },
  )

  it('Sets the payload so that APS skips setting the reference image if it does not exist', async () => {
    // Arrange
    const ctx = getDefaultContext()
    const req = getDefaultRequest()

    const originalTamperingPayload = noReferences()

    checkTampering.mockResolvedValue(originalTamperingPayload)

    // Act
    await configureTampering(ctx, req, {}, next)

    // Assert
    const expectedPayload = skipReferenceImage()
    expect(ctx.detections.tampering).toEqual(expectedPayload)
    expect(ctx.tamperingFlags).toMatchObject({
      overrideReason: originalTamperingPayload.withChecks,
    })
  })

  it('Sets the reference image if it does not exist', async () => {
    // Arrange
    const ctx = getDefaultContext()
    const req = getDefaultRequest()

    checkTampering.mockResolvedValue(noReferences())

    // Act
    await configureTampering(ctx, req, {}, next)

    // Assert
    expect(setReferenceImage).toBeCalledTimes(1)
    expect(writeTamperingEvent).toBeCalledTimes(1)
    expect(writeTamperingEvent.mock.calls[0][0]).toMatchObject({
      status: 'failed',
    })
  })

  it('Overrides the `withChecks.proceed` payload to `noChecks` (so that APS only processes tampering and does not save anything)', async () => {
    // Arrange
    const ctx = getDefaultContext()
    const req = getDefaultRequest()

    ctx.cameraData.tamperingConfig = {
      day: {
        referenceImage: 'day-uuid',
      },
      night: {
        referenceImage: 'night-uuid',
      },
    }

    checkTampering.mockResolvedValue(proceed(
      ctx.cameraData.tamperingConfig,
      'America/New_York',
    ))

    // Act
    await configureTampering(ctx, req, {}, next)

    // Assert
    expect(ctx.options.sceneChange.references).toHaveLength(2)

    expect(ctx.detections.tampering).toMatchObject({
      noChecks: {
        references: [
          {
            id: 'day-uuid',
          },
          {
            id: 'night-uuid',
          },
        ],
      },
    })

    expect(ctx.tamperingFlags).toMatchObject({
      registerTampering: true,
    })
  })

  it('Maybe saves a missing reference image when proceeding', async () => {
    // Arrange
    const ctx = getDefaultContext()
    const req = getDefaultRequest()

    ctx.cameraData.tamperingConfig = {
      day: {
        referenceImage: 'day-uuid',
      },
    }

    checkTampering.mockResolvedValue(proceed(
      ctx.cameraData.tamperingConfig,
      'America/New_York',
    ))

    // Act
    await configureTampering(ctx, req, {}, next)

    // Assert
    expect(ctx.options.sceneChange.references).toHaveLength(1)
    expect(maybeSaveMissingReference).toBeCalledTimes(1)
  })
})
