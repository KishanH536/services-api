import { jest } from '@jest/globals'

import {
  notEligibleForTampering,
  noReferences,
  skipPeriodDetection,
  proceed,
} from '../../payloads.js'

jest.unstable_mockModule('../detections', () => ({
  isTamperingAlreadyDone: jest.fn(),
}))

const {
  isTamperingAlreadyDone,
} = await import('../detections.js')

const {
  checkTampering,
} = await import('../index.js')

const testViewId = 'test-view-id'

describe('With Checks Tampering Configuration', () => {
  it('Returns a notEligible payload if the view does not have the feature', async () => {
    // Arrange
    const ctx = {
      features: {},
      cameraData: {
        viewId: testViewId,
      },
    }

    // Act
    const result = await checkTampering(ctx, {})

    // Assert
    expect(result).toMatchObject(notEligibleForTampering())
  })

  it('Returns a noReferences payload if the view does not have a reference image', async () => {
    // Arrange
    const ctx = {
      features: {
        sceneChangeDetection: true,
      },
      cameraData: {
        viewId: testViewId,
        tamperingConfig: {},
      },
    }

    // Act
    const result = await checkTampering(ctx, {})

    // Assert
    expect(result).toMatchObject(noReferences(testViewId))
  })

  it('Returns a skipPeriodDetection payload if tampering has already been done', async () => {
    // Arrange
    const ctx = {
      features: {
        sceneChangeDetection: true,
      },
      cameraData: {
        viewId: testViewId,
        tamperingConfig: {
          day: {
            referenceImage: 'day-uuid',
          },
          night: {
            referenceImage: 'night-uuid',
          },
        },
        siteTimezone: 'America/New_York',
      },
    }

    isTamperingAlreadyDone.mockResolvedValue(true)

    // Act
    const result = await checkTampering(ctx, {})

    // Assert
    expect(result).toMatchObject(skipPeriodDetection())
  })

  it('Returns a proceed payload if all checks pass', async () => {
    // Arrange
    const ctx = {
      features: {
        sceneChangeDetection: true,
      },
      cameraData: {
        viewId: testViewId,
        tamperingConfig: {
          day: {
            referenceImage: 'day-uuid',
          },
          night: {
            referenceImage: 'night-uuid',
          },
        },
        siteTimezone: 'America/New_York',
      },
    }

    isTamperingAlreadyDone.mockResolvedValue(false)

    // Act
    const result = await checkTampering(ctx, {})

    // Assert
    expect(result).toMatchObject(proceed(
      ctx.cameraData.tamperingConfig,
      ctx.cameraData.siteTimezone,
    ))
  })
})
