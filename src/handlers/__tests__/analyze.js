import { jest } from '@jest/globals'

// mock camera retrieval
jest.unstable_mockModule('../../core/retrieve_camera_data', () => ({
  getView: jest.fn(),
}))

jest.unstable_mockModule('../../core/retrieve_deleted_cameras', () => ({
  default: jest.fn(),
}))

// mock advanced rules
jest.unstable_mockModule('../../core/get_advanced_rules', () => ({
  getAdvancedRules: jest.fn(),
}))

jest.unstable_mockModule('../analyze/middleware/sceneChange/references', () => ({
  setReferenceImage: jest.fn(),
  maybeSaveMissingReference: jest.fn(),
}))

jest.unstable_mockModule('../../core/create_tampering_event', () => ({
  default: jest.fn(),
}))

jest.unstable_mockModule('../analyze/put_analysis', () => ({
  default: jest.fn(),
}))

// mock image processing
const mockGetMetadata = jest.fn(() => ({
  format: 'jpeg',
  width: 320,
  height: 240,
}))
const mockResizeImage = jest.fn(x => x)
jest.unstable_mockModule('../../common/image_processing', () => ({
  getMetadata: jest.fn(() => mockGetMetadata()),
  resizeImage: jest.fn(() => mockResizeImage()),
}))

// mock capabilities check.
jest.unstable_mockModule('../../utils/check_capabilities', () => ({
  checkDetectionCapabilities: jest.fn(),
}))

// mock APS
jest.unstable_mockModule('../../core/process_platform_analysis', () => ({
  processAnalysis: jest.fn(),
  processChip: jest.fn(),
}))

jest.unstable_mockModule('../../core/aidetection_to_pluginbox', () => ({
  normalizeObjectDetections: jest.fn(),
  normalizeChipDetections: jest.fn(),
}))

// mock prometheus
jest.unstable_mockModule('../../common/prometheus', () => ({
  totalAIFailures: {
    inc: jest.fn(),
  },
  dbErrorCounter: {
    inc: jest.fn(),
  },
}))

const { default: mockHttp } = await import('./utils/mock-http.js')

const { getView: retrieveCameraData } = await import('../../core/retrieve_camera_data.js')

const { default: getDeletedCameras } = await import('../../core/retrieve_deleted_cameras.js')

const { getAdvancedRules } = await import('../../core/get_advanced_rules.js')

const {
  checkDetectionCapabilities,
} = await import('../../utils/check_capabilities.js')

const {
  processChip: processPlatformChip,
  processAnalysis: processPlatformAnalysis,
} = await import('../../core/process_platform_analysis.js')
const {
  normalizeObjectDetections,
} = await import('../../core/aidetection_to_pluginbox.js')

const { totalAIFailures } = await import('../../common/prometheus.js')

const { ApsInvalidImagesError } = await import('../../common/errors/index.js')

const { analyzeAlarm, analyzeChip } = await import('../analyze/index.js')

const testViewId = 'ad1aa14a-b196-40e4-82e4-80f6595dc232'
const validRequestParams = {
  viewId: testViewId,
}

const validRequestFilesAlarm = {
  alarmImages: [{
    fieldname: 'alarmImages',
    buffer: Buffer.from(''),
  }],
}

const validRequestFilesChip = {
  chipImages: [{
    fieldname: 'chipImages',
    buffer: Buffer.from(''),
  }],
}

const viewStatusDetection = (detection) => ({
  active: true,
  advancedRules: [{
    id: 'detect-01',
    name: 'Detect 01',
    active: true,
    [detection]: {
      active: true,
    },
  }],
  isAdvancedAlarm: true,
})

describe('Camera Errors', () => {
  it(
    'Should return an error if the camera is not found.',
    async () => {
      // Arrange
      retrieveCameraData.mockResolvedValue(null)
      getDeletedCameras.mockResolvedValue(null)
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams

      // Act
      await analyzeAlarm(ctx, request, response)
      const data = response._getJSONData()

      // Assert
      expect(data.errors[0].detail).toBe('Camera not found')
      expect(response.statusCode).toBe(404)
    },
  )

  it(
    'Should return an error if the camera has been previously deleted.',
    async () => {
      // Arrange
      retrieveCameraData.mockResolvedValue(null)
      getDeletedCameras.mockResolvedValue([{ foo: 'bar' }])
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams

      // Act
      await analyzeAlarm(ctx, request, response)
      const data = response._getJSONData()

      // Assert
      expect(data.errors[0].detail).toBe('Camera has been deleted')
      expect(response.statusCode).toBe(410)
    },
  )

  it(
    'Should return an error if there is an exception getting the camera.',
    async () => {
      // Arrange
      retrieveCameraData.mockImplementation(() => {
        throw new Error('Test Error')
      })
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams

      // Act
      await analyzeAlarm(ctx, request, response)
      const data = response._getJSONData()

      // Assert
      expect(data.errors[0].detail).toBe('Internal Server Error')
      expect(response.statusCode).toBe(500)
    },
  )

  it(
    "Should return an error if the company doesn't have the capability to perform a detection",
    async () => {
      // Arrange
      retrieveCameraData.mockResolvedValueOnce({
        viewStatus: viewStatusDetection('faceDetection'),
      })

      checkDetectionCapabilities.mockResolvedValue({
        valid: false,
        missingCapabilities: ['DETECT_FACE'],
      })
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      request.files = validRequestFilesChip

      // Act
      await analyzeChip(ctx, request, response)

      // Assert
      expect(response.statusCode).toBe(403)
    },
  )

  it(
    'Should return an error if there are no advanced rules configured for chip detection.',
    async () => {
      // Arrange
      retrieveCameraData.mockResolvedValueOnce({
        viewStatus: {
          active: true,
          advancedRules: [],
          isAdvancedAlarm: true,
        },
      })

      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      request.files = validRequestFilesChip

      // Act
      await analyzeChip(ctx, request, response)

      // Assert
      expect(response.statusCode).toBe(400)
    },
  )

  it(
    'Should return no error if there are no advanced rules configured for chip detection but vehicle chips are requested.',
    async () => {
      // Arrange
      retrieveCameraData.mockResolvedValueOnce({
        viewStatus: {
          active: true,
          advancedRules: [],
          isAdvancedAlarm: true,
        },
        analytics: { vehicleAnalysis: { chipsType: 'vehicles' } },
      })
      checkDetectionCapabilities.mockResolvedValue({ valid: true })
      processPlatformChip.mockResolvedValue({})

      // The content-type has to be set to properly execute the image handler
      // middleware function (parseChipImages). The content-length header is
      // needed for the req.is('multipart/form-data') check to work, since the
      // .is() function returns null if no body is present.
      const { ctx, request, response } = mockHttp({
        headers: {
          'content-type': 'multipart/form-data',
          'content-length': 1,
        },
      })
      ctx.request.params = validRequestParams
      request.files = validRequestFilesChip
      // Act
      await analyzeChip(ctx, request, response)

      // Assert
      expect(response.statusCode).toBe(200)
    },
  )
})

describe('Request Errors', () => {
  beforeAll(() => {
    retrieveCameraData.mockResolvedValue({
      viewId: validRequestParams.viewId,
    })
  })

  it(
    'Should return an error if there are invalid options.',
    async () => {
      // Arrange
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      request.body = {
        options: {
          sceneChangeReferenceUrls: 'not-an-array',
        },
      }

      // Act
      await analyzeAlarm(ctx, request, response)

      // Assert
      expect(response.statusCode).toBe(400)
    },
  )
})

describe('Images', () => {
  beforeEach(() => {
    retrieveCameraData.mockResolvedValue({
      viewId: validRequestParams.viewId,
    })
    checkDetectionCapabilities.mockResolvedValue({ valid: true })
  })

  it.each([undefined, []])(
    'Returns an error if no images are provided',
    async (files) => {
      // Arrange
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      request.files = files

      // Act
      await analyzeAlarm(ctx, request, response)
      const data = response._getJSONData()

      // Assert
      expect(data.errors[0].detail).toBe('No images were provided')
      expect(response.statusCode).toBe(400)
    },
  )

  it('Returns an error if no-checks scene change is requested with no reference images.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    request.files = validRequestFilesAlarm
    request.body = {
      options: {
        performSceneChangeDetection: true,
      },
    }

    retrieveCameraData.mockResolvedValueOnce({
      viewStatus: {
        active: true,
        isObjectDetection: false,
      },
      tampering: true,
      tamperingConfig: {},
    })

    // Act
    await analyzeAlarm(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(400)
  })

  it('Returns an error if the images are the wrong dimension', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    request.files = validRequestFilesAlarm
    mockGetMetadata.mockReturnValueOnce({
      width: 319,
      height: 239,
    })

    // Act
    await analyzeAlarm(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('All images must be at least 320x240.')
    expect(response.statusCode).toBe(400)
  })

  it(
    'Ignores images with the wrong field name.',
    async () => {
      // Arrange
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      request.files = [{
        fieldname: 'wrong-name',
        buffer: Buffer.from(''),
      }]

      // Act
      await analyzeAlarm(ctx, request, response)
      const data = response._getJSONData()

      // Assert
      expect(data.errors[0].detail).toBe('No images were provided')
      expect(response.statusCode).toBe(400)
    },
  )
})

describe('Alarm Processing', () => {
  beforeEach(() => {
    processPlatformAnalysis.mockClear()
    retrieveCameraData.mockResolvedValue({
      viewId: testViewId,
      viewStatus: {},
    })
    checkDetectionCapabilities.mockResolvedValue({ valid: true })
  })

  it(
    'Processes images and provides a response.',
    async () => {
      // Arrange
      processPlatformAnalysis.mockResolvedValue({
        valid: true,
        analytics: {
          object: {
            detectionsFloat: [{}],
          },
        },
      })
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      request.files = validRequestFilesAlarm

      // Act
      await analyzeAlarm(ctx, request, response)
      const data = response._getJSONData()

      // Assert
      expect(data).toEqual(
        expect.objectContaining({
          data: expect.objectContaining({
            attributes: expect.objectContaining({
              analytics: expect.objectContaining({
                resultSummary: 'valid',
              }),
            }),
            id: expect.any(String),
            type: 'alarm-analysis',
          }),
        }),
      )

      expect(response.statusCode).toBe(200)
    },
  )

  it(
    'Overrides scene change detection if the capability is missing.',
    async () => {
      // Arrange
      retrieveCameraData.mockResolvedValueOnce({
        viewStatus: {
          active: true,
        },
        tampering: true,
      })
      // First check is for mandatory detections.
      checkDetectionCapabilities.mockResolvedValueOnce({
        valid: true,
      })
      // Second check is for tampering.
      checkDetectionCapabilities.mockResolvedValueOnce({
        valid: false,
        missingCapabilities: ['DETECT_SCENE_CHANGE'],
      })

      processPlatformAnalysis.mockClear() // Need to test the latest call.
      processPlatformAnalysis.mockResolvedValue({
        valid: true,
      })

      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      request.company = {
        id: 'test-company-id',
      }
      request.body.options = {
        performSceneChangeDetection: true,
        sceneChangeReferenceUrls: ['https://test-images.com/image1'],
      }
      request.files = validRequestFilesAlarm

      // Act
      await analyzeAlarm(ctx, request, response)

      // Assert

      const { options } = processPlatformAnalysis.mock.calls.pop()[0]
      const { detections } = options

      // Assert
      expect(detections).not.toBeFalsy()
      expect(detections.tampering.withChecks.notEligible).not.toBeFalsy()
      expect(detections.tampering.withChecks.notEligible.companyId).toBe(request.company.id)
      expect(response.statusCode).toBe(200)
    },
  )

  it.each([['gunDetection', 'gun'], ['faceDetection', 'face']])(
    'Calls APS with the right options for chips.',
    async (detectionType, chipType) => {
      // Arrange
      processPlatformChip.mockResolvedValue({})

      retrieveCameraData.mockResolvedValueOnce({
        viewStatus: viewStatusDetection(detectionType),
      })

      const { ctx, request, response } = mockHttp({
        headers: {
          'content-type': 'multipart/form-data',
          'content-length': 1,
        },
      })
      ctx.request.params = validRequestParams
      request.files = validRequestFilesChip

      // Act
      await analyzeChip(ctx, request, response)
      const { options } = processPlatformChip.mock.calls.pop()[0]
      const { detections } = options

      // Assert
      expect(detections).not.toBeFalsy()
      expect(detections[chipType].chips).toBe(true)
      expect(options.masks).toHaveLength(0)
    },
  )

  it.each(['gunDetection', 'faceDetection'])(
    'Calls APS without chip-style detections when processing alarms.',
    async (detectionType) => {
      // Arrange
      processPlatformAnalysis.mockResolvedValue({})

      retrieveCameraData.mockResolvedValueOnce({
        viewStatus: viewStatusDetection(detectionType),
      })

      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      request.files = validRequestFilesAlarm

      // Act
      await analyzeAlarm(ctx, request, response)
      const { options } = processPlatformAnalysis.mock.calls.pop()[0]
      const { detections } = options

      // Assert
      expect(detections).not.toBeFalsy()
      expect(detections).not.toHaveProperty('advanced')
    },
  )

  it(
    "Uses the camera's configuration to determine which advanced rules to process.",
    async () => {
      // Arrange
      processPlatformChip.mockResolvedValue({})

      retrieveCameraData.mockResolvedValueOnce({
        viewStatus: {
          active: true,
          isUsingNewAdvancedRules: true,
        },
      })

      getAdvancedRules.mockResolvedValueOnce([{
        id: 'detect-01',
        name: 'test-rule',
        active: true,
        objectType: 'mixed',
        detectionType: 'gun',
        zones: [],
      }])

      const { ctx, request, response } = mockHttp({
        headers: {
          'content-type': 'multipart/form-data',
          'content-length': 1,
        },
      })
      ctx.request.params = validRequestParams
      request.files = validRequestFilesChip

      // Act
      await analyzeChip(ctx, request, response)
      const { options } = processPlatformChip.mock.calls.pop()[0]
      const { detections } = options

      // Assert
      expect(detections).not.toBeFalsy()
      expect(detections.gun.chips).toBe(true)
    },
  )

  it
    .each([
      [[{ active: true }], false],
      [undefined, true],
    ])(
      'Calls APS with the right options for a view.',
      async (advancedRules, isObjectDetection) => {
        // Arrange
        processPlatformAnalysis.mockResolvedValue({})
        retrieveCameraData.mockResolvedValueOnce({
          viewStatus: {
            active: true,
            advancedRules,
            isObjectDetection,
          },
        })
        const { ctx, request, response } = mockHttp()
        ctx.request.params = validRequestParams
        request.files = validRequestFilesAlarm

        // Act
        await analyzeAlarm(ctx, request, response)

        // Assert
        const { options } = processPlatformAnalysis.mock.calls.pop()[0]
        expect(options.detections.gun?.chips).toBeFalsy()

        expect(options.detections.tampering)
          .toEqual(expect.any(Object))

        expect(options.detections.advanced).toBeUndefined()
        expect(options.detections.object).toBeUndefined()
        expect(options.hiRes).toBe(true)
      },
    )

  it('Calls APS with legacy tampering detections if the view only does scene change.', async () => {
    // Arrange
    processPlatformAnalysis.mockResolvedValue({})
    retrieveCameraData.mockResolvedValueOnce({
      viewId: testViewId,
      viewStatus: {
        active: true,
        isObjectDetection: false,
      },
      tampering: true,
      tamperingConfig: null,
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    request.files = validRequestFilesAlarm

    // Act
    await analyzeAlarm(ctx, request, response)

    // Assert
    const { options } = processPlatformAnalysis.mock.calls.pop()[0]

    // Expect options.detections?.tampering to be an object
    // with a `withChecks` property, which is an object.
    expect(options.detections?.tampering).toEqual({
      withChecks: expect.any(Object),
    })
  })

  it('APS returns reference URL of day image if legacy tampering checks performed', async () => {
    // Arrange
    processPlatformAnalysis.mockResolvedValue({
      valid: 'not_valid',
      alarmType: 'tampering-only',
      tampering: {
        isPerformed: true,
        isDay: true,
      },
    })
    retrieveCameraData.mockResolvedValueOnce({
      viewStatus: {
        active: true,
        isObjectDetection: false,
      },
      tampering: true,
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    request.files = validRequestFilesAlarm

    // Act
    await analyzeAlarm(ctx, request, response)
    // const result = response._getJSONData()
    const result = response._getJSONData()
    // Assert
    expect(result.data.attributes.sceneChange.reference.url).toContain('?refImage=day')
  })

  it('APS returns reference URL of day image if legacy tampering checks performed', async () => {
    // Arrange
    processPlatformAnalysis.mockResolvedValue({
      valid: 'not_valid',
      alarmType: 'tampering-only',
      tampering: {
        isPerformed: true,
        isDay: false,
      },
    })
    retrieveCameraData.mockResolvedValueOnce({
      viewStatus: {
        active: true,
        isObjectDetection: false,
      },
      tampering: true,
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    request.files = validRequestFilesAlarm

    // Act
    await analyzeAlarm(ctx, request, response)
    const result = response._getJSONData()
    // Assert
    expect(result.data.attributes.sceneChange.reference.url).toContain('?refImage=night')
  })

  it('Calls APS with tampering detections if no-check scene change is requested.', async () => {
    // Arrange
    processPlatformAnalysis.mockResolvedValue({})
    retrieveCameraData.mockResolvedValueOnce({
      viewStatus: {
        active: true,
        isObjectDetection: false,
      },
      tampering: true,
      tamperingConfig: {
        day: {
          referenceImage: 'day-reference-image-id',
        },
      },
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    request.body = {
      options: {
        performSceneChangeDetection: true,
      },
    }
    request.files = validRequestFilesAlarm

    // Act
    await analyzeAlarm(ctx, request, response)

    // Assert
    const { options } = processPlatformAnalysis.mock.calls.pop()[0]
    expect(options.detections).toEqual({
      tampering: {
        noChecks: {
          references: [{
            id: 'day-reference-image-id',
          }],
        },
      },
    })
  })

  it("Does not perform on-demand scene change if the view isn't configured for scene change.", async () => {
    // Arrange
    processPlatformAnalysis.mockClear()
    processPlatformAnalysis.mockResolvedValue({})
    retrieveCameraData.mockResolvedValueOnce({
      viewId: 'test-view-id',
      viewStatus: {
        active: true,
        isObjectDetection: false,
      },
      tampering: false,
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    request.body = {
      options: {
        performSceneChangeDetection: true,
        sceneChangeReferenceUrls: ['https://test-images.com/image1'],
      },
    }
    request.files = validRequestFilesAlarm

    // Act
    await analyzeAlarm(ctx, request, response)

    // Assert
    const { options } = processPlatformAnalysis.mock.calls.pop()[0]
    expect(options.detections).toEqual({
      tampering: {
        withChecks: {
          notEligible: {
            viewId: 'test-view-id',
          },
        },
      },
    })
  })

  it('Calls APS with tampering detections if scene change force skipped.', async () => {
    // Arrange
    processPlatformAnalysis.mockResolvedValue({})
    retrieveCameraData.mockResolvedValueOnce({
      viewStatus: {
        active: true,
        isObjectDetection: false,
      },
      tampering: true,
      tamperingConfig: {
        day: {
          referenceImage: 'day-reference-image-id',
        },
      },
    })
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    request.body = {
      options: {
        performSceneChangeDetection: false,
      },
    }
    request.files = validRequestFilesAlarm

    // Act
    await analyzeAlarm(ctx, request, response)

    // Assert
    const { options } = processPlatformAnalysis.mock.calls.pop()[0]
    expect(options.detections).toEqual({
      tampering: {
        withChecks: {
          skip: {},
        },
      },
    })
  })

  it.each([
    [false, 'not_valid'],
    [true, 'valid'],
  ])(
    'Returns a result summary based on the APS response.',
    async (valid, result) => {
      // Arrange
      processPlatformAnalysis.mockResolvedValue({
        analytics: {
          object: {
            detectionsFloat: [{}],
          },
        },
        valid,
      })
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      request.files = validRequestFilesAlarm

      // Act
      await analyzeAlarm(ctx, request, response)
      const responseData = response._getJSONData()

      // Assert
      expect(responseData.data.attributes.analytics.resultSummary).toEqual(result)
    },
  )

  it(
    'Handles a tampering error from APS.',
    async () => {
      // Arrange
      processPlatformAnalysis.mockResolvedValue({

        tampering: {
          error: 'tampering error',
        },
      })
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      request.files = validRequestFilesAlarm

      // Act
      await analyzeAlarm(ctx, request, response)
      const responseData = response._getJSONData()

      const {
        data: {
          attributes: {
            sceneChange,
          },
        },
      } = responseData

      // Assert
      expect(sceneChange.result).toEqual('not_performed')
      expect(sceneChange.reason).toEqual(expect.objectContaining({
        error: expect.any(String),
      }))
    },
  )

  it(
    'Does not contain a result summary for tampering only alarms.',
    async () => {
      // Arrange
      processPlatformAnalysis.mockResolvedValue({ alarmType: 'tampering-only' })
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      request.files = validRequestFilesAlarm

      // Act
      await analyzeAlarm(ctx, request, response)
      const responseData = response._getJSONData()

      // Assert
      expect(responseData.data.attributes.analytics).toEqual(
        expect.not.objectContaining({
          resultSummary: expect.any(String),
        }),
      )
    },
  )

  it(
    'Returns bounding boxes if there are detections.',
    async () => {
      // Arrange
      const mockBoundingBoxes = [[{
        x1: 0.1,
        y1: 0.1,
        x2: 0.2,
        y2: 0.2,
        objectType: 'person',
      }]]

      processPlatformAnalysis.mockResolvedValue({
        analytics: {
          object: {
            detectionsFloat: [{}],
          },
        },
        alarmType: 'regular_alarm',
      })
      normalizeObjectDetections.mockReturnValue(mockBoundingBoxes)
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      request.files = validRequestFilesAlarm

      // Act
      await analyzeAlarm(ctx, request, response)
      const responseData = response._getJSONData()

      // Assert
      expect(responseData.data.attributes.analytics.objectDetection.boundingBoxes)
        .toEqual(mockBoundingBoxes)
    },
  )

  it.each([
    [false, false, 'not_performed'],
    [true, false, 'not_valid'],
    [false, true, 'not_performed'],
    [true, true, 'valid'],
  ])(
    'Returns a scene change result if tampering is analyzed.',
    async (isPerformed, isValid, result) => {
      // Arrange
      processPlatformAnalysis.mockResolvedValue({
        tampering: {
          isPerformed,
          isValid,
        },
      })

      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      request.files = validRequestFilesAlarm

      // Act
      await analyzeAlarm(ctx, request, response)
      const responseData = response._getJSONData()

      // Assert
      expect(responseData.data.attributes.sceneChange.result).toEqual(result)
    },
  )

  it(
    'Returns an error if the APS request failed.',
    async () => {
      // Arrange
      processPlatformAnalysis.mockImplementation(() => {
        throw new Error('Test Error')
      })
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      request.files = validRequestFilesAlarm

      // Act
      await analyzeAlarm(ctx, request, response)
      const data = response._getJSONData()

      // Assert
      expect(totalAIFailures.inc).toHaveBeenCalled()
      expect(data.errors[0].detail).toBe('Internal Server Error')
      expect(response.statusCode).toBe(500)
    },
  )

  it(
    'Returns a Bad Request error if the APS request failed due to no valid images.',
    async () => {
      // Arrange
      const errorMessage = 'Test Error'
      processPlatformAnalysis.mockImplementation(() => {
        throw new ApsInvalidImagesError(errorMessage)
      })
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      request.files = validRequestFilesAlarm

      // Act
      await analyzeAlarm(ctx, request, response)
      const data = response._getJSONData()

      // Assert
      expect(totalAIFailures.inc).toHaveBeenCalled()
      expect(data.errors[0].detail).toBe(errorMessage)
      expect(response.statusCode).toBe(400)
    },
  )

  it(
    'Calls APS with the standard analysis handler for a PLATFORM company',
    async () => {
      // Arrange
      processPlatformAnalysis.mockResolvedValue({})
      retrieveCameraData.mockResolvedValueOnce({
        viewStatus: {
          active: true,
          isObjectDetection: true,
        },
      })
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      request.body = {}
      request.files = validRequestFilesAlarm

      // Act
      await analyzeAlarm(ctx, request, response)

      // Assert
      expect(processPlatformAnalysis).toHaveBeenCalled()
    },
  )
})
