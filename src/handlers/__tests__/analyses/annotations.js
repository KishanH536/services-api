import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../services/index.js', () => ({
  services: {
    Dynamo: {
      getAnalysisResult: jest.fn(),
    },
    Redshift: {
      insertAnnotation: jest.fn(),
    },
  },
}))

const { services } = await import('../../../services/index.js')
const { default: mockHttp } = await import('../utils/mock-http.js')
const { default: addAnnotations } = await import('../../analyses/addAnnotations.js')

const {
  Dynamo: dynamo,
  Redshift: redshift,
} = services

describe('Add annotations.', () => {
  beforeEach(() => {
    dynamo.getAnalysisResult.mockClear()
    redshift.insertAnnotation.mockClear()
  })

  it('Should return a 404 if the analysis result does not exist', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()

    // Act
    dynamo.getAnalysisResult.mockResolvedValue(null)
    await addAnnotations(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(404)
  })

  it('Should return a 500 if there is an error ', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()

    // Act
    dynamo.getAnalysisResult.mockResolvedValue({})
    redshift.insertAnnotation.mockRejectedValue(new Error('Test error'))
    await addAnnotations(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(500)
  })

  it('Should return a 204 if the annotation is successfully added', async () => {
    // Arrange
    const analysisId = 'testAnalysisId'
    const description = 'testDescription'
    const companyId = 'testCompanyId'

    const { ctx, request, response } = mockHttp()
    request.companyId = companyId
    ctx.request.params = {
      analysisId,
    }
    ctx.request.body = {
      description,
    }

    // Act
    dynamo.getAnalysisResult.mockResolvedValue({})
    redshift.insertAnnotation.mockResolvedValue()
    await addAnnotations(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(204)
    expect(dynamo.getAnalysisResult).toHaveBeenCalledWith(companyId, analysisId)
    expect(redshift.insertAnnotation).toHaveBeenCalledWith(analysisId, description)
  })
})
