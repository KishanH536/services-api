import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../utils/embeddings.js', () => ({
  removeFaceEmbeddings: jest.fn(),
}))

jest.unstable_mockModule('../../../services/index.js', () => ({
  services: {
    Dynamo: {
      putAnalysisResult: jest.fn(),
    },
  },
}))

const { removeFaceEmbeddings } = await import('../../../utils/embeddings.js')
const { default: putAnalysis } = await import('../put_analysis.js')
const {
  services: {
    Dynamo: {
      putAnalysisResult,
    },
  },
} = await import('../../../services/index.js')

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
}

const defaultCtx = {
  cameraData: {
    viewId: 'default-view-id',
    siteId: 'default-site-id',
  },
}

describe('Put Analysis', () => {
  beforeEach(() => {
    removeFaceEmbeddings.mockClear()
    putAnalysisResult.mockClear()
  })

  it('Does not store analysis result if the company does not retain its data', async () => {
    // Arrange
    const req = {
      company: {
        alarmRetentionDays: 0,
      },
      logger: mockLogger,
    }
    const responseBody = {}

    // Act
    await putAnalysis(defaultCtx, req, responseBody)

    // Assert
    expect(putAnalysisResult).not.toHaveBeenCalled()
  })

  it('Removes embeddings if the analysis result contains face detection', async () => {
    // Arrange
    const req = {
      company: {
        alarmRetentionDays: 1,
      },
      logger: mockLogger,
    }
    const responseBody = {
      data: {
        id: 'analysis-id',
        attributes: {
          analytics: {
            faceDetection: {},
          },
        },
      },
    }

    // Act
    await putAnalysis(defaultCtx, req, responseBody)

    // Assert
    expect(removeFaceEmbeddings).toHaveBeenCalled()
  })

  it('Stores the analysis result', async () => {
    // Arrange
    const req = {
      company: {
        id: 'company-id',
        alarmRetentionDays: 1,
      },
      logger: mockLogger,
    }
    const responseBody = {
      data: {
        id: 'analysis-id',
        attributes: {
          analytics: {},
        },
      },
    }

    // Act
    await putAnalysis(defaultCtx, req, responseBody)

    // Assert
    expect(putAnalysisResult).toHaveBeenCalled()
  })

  it('Sends the analysis result with the correct expiration time', async () => {
    const req = {
      company: {
        id: 'company-id',
        alarmRetentionDays: 1,
      },
      logger: mockLogger,
    }

    const responseBody = {
      data: {
        id: 'analysis-id',
        attributes: {
          analytics: {},
        },
      },
    }

    const currentDate = new Date('2025-01-01')
    const expectedExpiryAt = Math.floor(new Date('2025-01-02') / 1000)
    jest.useFakeTimers().setSystemTime(currentDate)
    await putAnalysis(defaultCtx, req, responseBody)

    expect(putAnalysisResult).toHaveBeenLastCalledWith(
      expect.objectContaining({
        companyId: expect.any(String),
        analysisId: expect.any(String),
        analysisResult: expect.any(Object),
        expireAt: expectedExpiryAt,
        viewId: defaultCtx.cameraData.viewId,
        siteId: defaultCtx.cameraData.siteId,
      }),
    )
  })
})
