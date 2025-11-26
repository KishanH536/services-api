import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/find_project_by_integrator_id', () => ({
  default: jest.fn(),
}))

const {
  MY_BASE_URL_FOR_LINKS: myBaseUrl,
} = await import('../../../../config/misc.js')

const { default: getClientIntegrator } = await import('../../integrator/get_client.js')
const { default: mockHttp } = await import('../utils/mock-http.js')

const { default: findProjectByIntegratorId } = await import('../../../core/find_project_by_integrator_id.js')

const testClientId = 'b1b6f619-7cd5-470e-bb4e-2dffedbd9963'
const testClientIntegratorId = 'Test Client?Integrator/Id&'
const testClientIntegratorIdEncoded = encodeURIComponent(testClientIntegratorId)
const testClientDisplayName = 'Test Client Display Name'

const validRequestParams = {
  clientIntegratorId: testClientIntegratorId,
}

const mockProject = {
  id: testClientId,
  integratorId: testClientIntegratorId,
  name: testClientDisplayName,
}

describe('Request Errors', () => {
  it('Should return not found if the client is not found', async () => {
    // Arrange
    findProjectByIntegratorId.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getClientIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(response.statusCode).toBe(404)
    expect(data.errors[0].status).toBe('404')
  })
})

describe('Get a client', () => {
  beforeAll(() => {
    findProjectByIntegratorId.mockResolvedValue(mockProject)
  })

  it('Has the correct response structure.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getClientIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          attributes: expect.objectContaining({
            integratorId: expect.any(String),
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
    await getClientIntegrator(ctx, request, response)
    const {
      data: {
        id,
        attributes: {
          integratorId,
          displayName,
        },
      },
    } = response._getJSONData()

    // Assert
    expect(id).toBe(testClientId)
    expect(integratorId).toBe(testClientIntegratorId)
    expect(displayName).toBe(testClientDisplayName)
  })

  it('Should add links to the response.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getClientIntegrator(ctx, request, response)
    const {
      data: { links },
    } = response._getJSONData()

    // Assert
    expect(links).toEqual(expect.objectContaining({
      self: `${myBaseUrl}/integrator/clients/${testClientIntegratorIdEncoded}`,
    }))
  })

  it('Should return the correct status code.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getClientIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(200)
  })
})

describe('Get client failure', () => {
  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    findProjectByIntegratorId.mockImplementation(() => {
      throw new Error('Test Error')
    })

    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getClientIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
