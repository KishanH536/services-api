import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../../../core/create_or_update_camera', () => ({
  updateView: jest.fn(),
}))

jest.unstable_mockModule('../../../../../common/s3', () => ({
  uploadTamperingRef: jest.fn(),
}))

jest.unstable_mockModule('../../../../../utils/scene_change', () => ({
  isNowDayTime: jest.fn(),
}))

const { updateView } = await import('../../../../../core/create_or_update_camera.js')
const { uploadTamperingRef } = await import('../../../../../common/s3.js')

const {
  isNowDayTime,
} = await import('../../../../../utils/scene_change.js')

const {
  setReferenceImage,
  maybeSaveMissingReference,
} = await import('../references.js')

const testImage = Buffer.from('')

const logger = {
  info: jest.fn(),
  error: jest.fn(),
}

const testDayReferenceId = 'day-id'
const testNightReferenceId = 'night-id'

const testTamperingConfig = {
  day: {
    referenceImage: testDayReferenceId,
  },
  night: {
    referenceImage: testNightReferenceId,
  },
}

// Util function for parsing the args of a call to update a view.
const getLastCalledUpdateViewTamperingConfig = () => {
  const updateViewArgs = updateView.mock.calls.at(-1)
  // 4th Arg is the object which contains the props to update on the view.
  return updateViewArgs[3].tamperingConfig
}

describe('Sets a reference image', () => {
  beforeEach(() => {
    updateView.mockClear()
    uploadTamperingRef.mockClear()
    uploadTamperingRef.mockImplementation() // mockClear doesn't clear the implementation
    isNowDayTime.mockClear()
    logger.error.mockClear()
  })

  it('Sets a reference image', async () => {
    const cameraData = {
      tamperingConfig: testTamperingConfig,
    }

    await setReferenceImage(
      cameraData,
      testImage,
      true,
      logger,
    )

    expect(uploadTamperingRef).toBeCalledTimes(1)
    expect(updateView).toBeCalledTimes(1)
  })

  it('Uses the existing reference ID if it exists.', async () => {
    const cameraData = {
      tamperingConfig: testTamperingConfig,
    }

    await setReferenceImage(
      cameraData,
      testImage,
      true, // Day time
      logger,
    )

    // Assert
    const updatedTamperingConfig = getLastCalledUpdateViewTamperingConfig(updateView)
    expect(updatedTamperingConfig?.day).toMatchObject({
      referenceImage: testDayReferenceId,
    })
  })

  it('Sets a default tampering config if it does not exist.', async () => {
    const cameraData = {
      tamperingConfig: null,
    }

    await setReferenceImage(
      cameraData,
      testImage,
      true, // Day time
      logger,
    )

    // Assert
    const updatedTamperingConfig = getLastCalledUpdateViewTamperingConfig(updateView)

    // The night reference props should be set to default
    expect(updatedTamperingConfig?.night).toMatchObject({
      referenceImage: null,
      referenceImageUpdatedAt: null,
      isUpdatingReferenceImage: false,
    })
  })

  it('Logs an error if the image upload fails.', async () => {
    const cameraData = {
      tamperingConfig: testTamperingConfig,
    }

    uploadTamperingRef.mockRejectedValue(new Error('Test Error'))

    await setReferenceImage(
      cameraData,
      testImage,
      true,
      logger,
    )

    expect(logger.error).toBeCalledTimes(1)
  })

  it('Logs an error if it fails to update the view.', async () => {
    const cameraData = {
      tamperingConfig: testTamperingConfig,
    }

    updateView.mockRejectedValue(new Error('Test Error'))

    await setReferenceImage(
      cameraData,
      testImage,
      true,
      logger,
    )

    expect(logger.error).toBeCalledTimes(1)
  })
})

describe('Maybe saves a missing reference image', () => {
  beforeEach(() => {
    uploadTamperingRef.mockClear()
  })

  it.each([
    [true, true, false],
    [true, false, true],
    [false, true, true],
    [false, false, false],
  ])(
    'Saves missing reference images when necessary.',
    async (isDayTime, isDayAvailable, shouldSave) => {
      // Arrange
      isNowDayTime.mockReturnValue(isDayTime)
      const references = [
        { label: isDayAvailable ? 'day' : 'night' },
      ]

      // Tampering config won't look like this, but doesn't matter for this test.
      const cameraData = {
        tamperingConfig: testTamperingConfig,
      }

      // Act
      await maybeSaveMissingReference(
        cameraData,
        testImage,
        references,
        logger,
      )

      // Assert
      expect(uploadTamperingRef).toBeCalledTimes(shouldSave ? 1 : 0)
    },
  )
})
