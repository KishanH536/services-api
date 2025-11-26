import { getAnalyticsResponse } from '../getResponseBody'

const validResponse = {
  person: {
    valid: true,
    detections: [],
  },
  sceneClassification: {
    valid: false,
    detections: [],
  },
}

const notPerformedResponse = {
  person: {
    valid: false,
    detections: [],
  },
  sceneClassification: {
    valid: false,
    error: {},
  },
}

const ctx = {
  companyCapabilities: [],
}

const validResult = { detectionResult: 'valid' }
const notValidResult = { detectionResult: 'not_valid' }
const notPerformedResult = { detectionResult: 'not_performed' }

describe('Set valid resultSummaries for valid/not_valid/error responses', () => {
  it('Should set the appropriate summaries based on APS response', async () => {
    const shapedResult = getAnalyticsResponse(validResponse, ctx)
    expect(shapedResult.resultSummaries?.personAnalysis).toEqual(validResult)
    expect(shapedResult.resultSummaries?.sceneClassification).toEqual(notValidResult)
  })

  it('Should set not_performed for any error results', async () => {
    const shapedResult = getAnalyticsResponse(notPerformedResponse, ctx)
    expect(shapedResult.resultSummaries?.personAnalysis).toEqual(notValidResult)
    expect(shapedResult.resultSummaries?.sceneClassification).toEqual(notPerformedResult)
  })
})

describe('Setting not_performed resultSummaries for error responses for multipleRisk', () => {
  const goodMultipleRisk = {
    multipleRisk: {
      valid: true,
      securityRisks: {
        valid: true,
        description: 'A black backpack is left unattended on the counter.',
        categories: { unattendedBaggage: {} },
      },
      environmentalHazards: {
        valid: false,
        description: 'No environmental hazards were identified in the provided image.',
      },
    },
  }
  const errorMultipleRisk = {
    multipleRisk: {
      valid: true,
      securityRisks: {
        valid: false,
        error: {},
      },
      environmentalHazards: {
        valid: false,
        error: {},
      },
    },
  }

  it('Creates the correct summary for good multiple risk', async () => {
    const shapedResult = getAnalyticsResponse(goodMultipleRisk, ctx)
    expect(shapedResult.resultSummaries?.multipleRiskAnalysis).toEqual(validResult)
  })

  it('Creates the correct summary for not_performed multiple risk', async () => {
    const shapedResult = getAnalyticsResponse(errorMultipleRisk, ctx)
    expect(shapedResult.resultSummaries?.multipleRiskAnalysis).toEqual(notPerformedResult)
  })
})
