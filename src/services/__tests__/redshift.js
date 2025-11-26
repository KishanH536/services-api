import { jest } from '@jest/globals'

const mockClient = {
  send: jest.fn(),
  destroy: jest.fn(),
}

const instantiationCounter = jest.fn()

jest.unstable_mockModule('@aws-sdk/client-redshift-data', () => ({
  // This is a constructor function so it can't use shorthand
  // eslint-disable-next-line object-shorthand
  RedshiftDataClient: function () {
    instantiationCounter()
    return mockClient
  },
  ExecuteStatementCommand: jest.fn(),
}))

const { ExecuteStatementCommand } = await import('@aws-sdk/client-redshift-data')
const { startRedshift } = await import('../redshift.js')

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
}

describe('startRedshift', () => {
  beforeEach(() => {
    mockClient.destroy.mockClear()
    instantiationCounter.mockClear()
  })

  it('should create a RedshiftDataClient', async () => {
    // Act
    await startRedshift({}, mockLogger)

    // Assert
    expect(instantiationCounter).toHaveBeenCalledTimes(1)
  })

  it('should destroy the client when the service is stopped', async () => {
    // Arrange
    const { stop } = await startRedshift({}, mockLogger)

    // Act
    await stop()

    // Assert
    expect(mockClient.destroy).toHaveBeenCalledTimes(1)
  })
})

describe('insertAnnotation', () => {
  beforeEach(() => {
    ExecuteStatementCommand.mockClear()
    mockClient.send.mockClear()
  })

  it('should insert an annotation into Redshift', async () => {
    // Arrange
    const response = { $metadata: { httpStatusCode: 200 } }
    mockClient.send.mockResolvedValue(response)
    const { service: redshiftService } = await startRedshift({}, mockLogger)

    // Act
    await redshiftService.insertAnnotation('analysisId', 'description')

    // Assert
    expect(mockClient.send).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).toHaveBeenCalledWith(
      { response },
      expect.any(String),
    )
  })

  it('should log and throw an error if the response status code is not 200', async () => {
    // Arrange
    const response = { $metadata: { httpStatusCode: 500 } }
    mockClient.send.mockResolvedValue(response)
    const { service: redshiftService } = await startRedshift({}, mockLogger)

    // Assert
    await expect(redshiftService.insertAnnotation('analysisId', 'description')).rejects.toThrow()

    expect(mockClient.send).toHaveBeenCalledTimes(1)
    expect(mockLogger.error).toHaveBeenCalledWith(
      { response },
      expect.any(String),
    )
  })

  it('should transform input to the correct parameter format', async () => {
    // Arrange
    const analysisId = 'analysisId'
    const description = 'description'

    const response = { $metadata: { httpStatusCode: 200 } }
    mockClient.send.mockResolvedValue(response)
    const { service: redshiftService } = await startRedshift({}, mockLogger)

    // Act
    await redshiftService.insertAnnotation('analysisId', 'description')

    // Assert
    expect(ExecuteStatementCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Parameters: [{
          name: 'analysisId',
          value: analysisId,
        }, {
          name: 'description',
          value: description,
        }],
      }),
    )
  })
})
