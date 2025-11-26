import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/get_project', () => ({
  default: jest.fn(),
}))

const {
  MY_BASE_URL_FOR_LINKS: myBaseUrl,
} = await import('../../../../config/misc.js')

const { default: getClientCalipsa } = await import('../../calipsa/get_client.js')
const { default: mockHttp } = await import('../utils/mock-http.js')
const { default: getProject } = await import('../../../core/get_project.js')

const testClientId = 'b1b6f619-7cd5-470e-bb4e-2dffedbd9963'
const testDisplayName = 'Test Client Display Name'

const validRequestParams = {
  clientId: testClientId,
}

const mockProject = {
  id: testClientId,
  name: testDisplayName,
}

describe('Request Errors', () => {
  it('Should return not found if the client is not found', async () => {
    // Arrange
    getProject.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getClientCalipsa(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(response.statusCode).toBe(404)
    expect(data.errors[0].status).toBe('404')
  })
})

describe('Get a client', () => {
  beforeAll(() => {
    getProject.mockResolvedValue(mockProject)
  })

  it('Has the correct response structure.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getClientCalipsa(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          attributes: expect.objectContaining({
            displayName: expect.any(String),
          }),
          id: expect.any(String),
          type: 'client',
          links: expect.any(Object),
        }),
      }),
    )
  })

  it('Should get a client.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getClientCalipsa(ctx, request, response)
    const {
      data: {
        id,
        attributes: {
          displayName,
        },
      },
    } = response._getJSONData()

    // Assert
    expect(id).toBe(testClientId)
    expect(displayName).toBe(testDisplayName)
  })

  it('Should add links to the response.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getClientCalipsa(ctx, request, response)
    const {
      data: { links },
    } = response._getJSONData()

    // Assert
    expect(links).toEqual(expect.objectContaining({
      self: `${myBaseUrl}/clients/${testClientId}`,
    }))
  })

  it('Should return the correct status code.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getClientCalipsa(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(200)
  })
})

describe('Get client failure', () => {
  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    getProject.mockImplementation(() => {
      throw new Error('Test Error')
    })

    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getClientCalipsa(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
