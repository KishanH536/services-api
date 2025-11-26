import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../services/index.js', () => ({
  services: {
    Dynamo: {
      getAnalysisResult: jest.fn(),
    },
  },
}))

jest.unstable_mockModule('../../../common/s3.js', () => ({
  getOriginalImagesUrl: jest.fn(),
}))

const { services } = await import('../../../services/index.js')
const { default: mockHttp } = await import('../utils/mock-http.js')
const { default: getAnalysis } = await import('../../analyses/get_analysis.js')
const { getOriginalImagesUrl } = await import('../../../common/s3.js')

const {
  Dynamo: dynamo,
} = services

describe('Get analysis result.', () => {
  beforeEach(() => {
    dynamo.getAnalysisResult.mockClear()
  })

  it('Should return a 404 if the analysis result does not exist', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()

    // Act
    dynamo.getAnalysisResult.mockResolvedValue(null)
    await getAnalysis(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(404)
  })

  it('Should return a 500 if there is an error ', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()

    // Act
    dynamo.getAnalysisResult.mockImplementation(() => {
      throw new Error('Test Error')
    })
    await getAnalysis(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(500)
  })

  it('Should return the correct response if the analysis result is retreived', async () => {
    // Arrange
    const analysisId = 'testAnalysisId'
    const companyId = 'testCompanyId'
    const imagesUrl = 'http://s3-presigned-url.com'
    const analysisResult = {
      testProp: 'testVal',
    }

    const { ctx, request, response } = mockHttp()
    request.companyId = companyId
    ctx.request.params = {
      analysisId,
    }

    getOriginalImagesUrl.mockResolvedValue(imagesUrl)
    dynamo.getAnalysisResult.mockResolvedValue({ analysisResult })

    // Act
    await getAnalysis(ctx, request, response)
    const { data } = response._getJSONData()

    // Assert
    expect(response.statusCode).toBe(200)
    expect(dynamo.getAnalysisResult).toHaveBeenCalledWith(companyId, analysisId)
    expect(data.attributes.originalImagesUrl).toBe(imagesUrl)
    expect(data.attributes.analysisResult).toStrictEqual(analysisResult)
  })
})
