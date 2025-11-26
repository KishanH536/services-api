import { jest } from '@jest/globals'

import {
  DYNAMODB_ANALYSIS_RESULTS_RESULT_LIMIT as resultLimit,
} from '../../../../config/aws.js'

import {
  uuidFromTimestamp,
} from '../utils.js'

const mockDynamoClient = {
  send: jest.fn().mockResolvedValue({ Items: [] }),
}

jest.unstable_mockModule('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: () => mockDynamoClient,
  },
  GetCommand: jest.fn(),
  PutCommand: jest.fn(),
  QueryCommand: jest.fn(),
}))

const { startDynamo } = await import('../index.js')

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
}

const createdAt = '2025-01-01T00:00:00.000Z'
const analysisId = '01941f29-7c00-7a40-a795-64d7115c7d54'
const companyId = 'testCompanyId'
const viewId = 'testViewId'
const siteId = 'testSiteId'

const viewConfig = {
  masks: [],
  features: {},
}

const sampleItem = {
  analysisResult: {
    data: {
      attributes: {
        attr1: 'val1',
      },
    },
  },
  createdAt,
  analysisId,
  companyId,
  viewId,
  siteId,
  viewConfig,
}

const defaultParams = {
  startTime: createdAt,
  endTime: createdAt,
  viewId,
  siteId,
}

const { service } = await startDynamo([], mockLogger)

describe('Get Analysis Results', () => {
  beforeEach(() => {
    mockDynamoClient.send.mockClear()
  })

  it('Should return an empty array for no analyses', async () => {
    // Arrange
    mockDynamoClient.send.mockResolvedValueOnce({
      Items: [],
    })

    // Act
    const {
      analyses,
    } = await service.getAnalysisResults(
      companyId,
      defaultParams,
    )

    // Assert
    expect(analyses).toEqual([])
  })

  it('Should return normalized results', async () => {
    // Arrange
    const {
      analysisResult: {
        data: {
          attributes: expectedAnalysis,
        },
      },
    } = sampleItem

    mockDynamoClient.send.mockResolvedValueOnce({
      Items: [sampleItem],
    })

    // Act
    const {
      analyses,
    } = await service.getAnalysisResults(
      companyId,
      defaultParams,
    )

    // Assert
    expect(analyses).toHaveLength(1)
    expect(analyses[0]).toMatchObject({
      analysisResult: expectedAnalysis,
      createdAt,
      analysisId,
      companyId,
      viewId,
      siteId,
      viewConfig,
    })
  })

  it('Should trim results to the configured result limit', async () => {
    // Arrange
    mockDynamoClient.send.mockResolvedValueOnce({
      Items: new Array(resultLimit + 1).fill(sampleItem),
    })

    // Act
    const {
      analyses,
    } = await service.getAnalysisResults(
      companyId,
      defaultParams,
    )

    // Assert
    expect(analyses).toHaveLength(resultLimit)
  })

  it('Should return a next value if there are additional results', async () => {
    // Arrange
    const lastDate = new Date(createdAt)
    lastDate.setSeconds(lastDate.getSeconds() + 1)
    const lastTimestamp = lastDate.toISOString()
    const lastId = uuidFromTimestamp(lastTimestamp)

    // items 0-limit
    const testResults = new Array(resultLimit).fill(sampleItem)

    // (limit + 1)th item
    testResults.push({
      ...sampleItem,
      analysisId: lastId,
      createdAt: lastTimestamp,
    })

    mockDynamoClient.send.mockResolvedValueOnce({
      Items: testResults,
    })

    // Act
    const {
      nextTimestamp,
    } = await service.getAnalysisResults(
      companyId,
      defaultParams,
    )

    // Assert
    expect(nextTimestamp).toBe(lastTimestamp)
  })

  it('Should repeat queries if more results are available', async () => {
    // Arrange
    // Just pick something with a non-zero remainder
    const queryResultLength = Math.floor(resultLimit / 3)
    const expectedCalls = Math.ceil(resultLimit / queryResultLength)
    const testItems = new Array(queryResultLength).fill(sampleItem)

    mockDynamoClient.send.mockResolvedValue({
      Items: testItems,
      LastEvaluatedKey: {
        analysisId,
      },
    })

    // Act
    const {
      analyses,
      nextTimestamp,
    } = await service.getAnalysisResults(
      companyId,
      defaultParams,
    )

    // Assert
    expect(analyses).toHaveLength(resultLimit)
    expect(nextTimestamp).toBeDefined()
    expect(mockDynamoClient.send).toHaveBeenCalledTimes(expectedCalls)
  })

  // Even if there are exactly `resultLimit` results!
  it('Should return a next value if Dynamo indicates there are more results', async () => {
    // Arrange
    const expectedTimestamp = new Date(createdAt)
    // Query loop adds 1ms to avoid repeating last item
    expectedTimestamp.setMilliseconds(
      expectedTimestamp.getMilliseconds() + 1,
    )
    // items 0-limit
    const testResults = new Array(resultLimit).fill(sampleItem)

    mockDynamoClient.send.mockResolvedValueOnce({
      Items: testResults,
      LastEvaluatedKey: {
        analysisId,
      },
    })

    // Act
    const {
      nextTimestamp,
    } = await service.getAnalysisResults(
      companyId,
      defaultParams,
    )

    // Assert
    expect(nextTimestamp).toBe(expectedTimestamp.toISOString())
  })
})
