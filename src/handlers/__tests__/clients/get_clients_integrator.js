import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/get_projects', () => ({
  default: jest.fn(),
}))

const {
  MY_BASE_URL_FOR_LINKS: myBaseUrl,
} = await import('../../../../config/misc.js')

const { default: getClientsIntegrator } = await import('../../integrator/get_clients.js')
const { default: mockHttp } = await import('../utils/mock-http.js')
const { default: getProjects } = await import('../../../core/get_projects.js')

const testClientId = 'b1b6f619-7cd5-470e-bb4e-2dffedbd9963'
const testClientIntegratorId = 'Test Client?Integrator/Id&'
const testClientDisplayName = 'test-site-display-name'

const mockProject = {
  id: testClientId,
  name: testClientDisplayName,
  integratorId: testClientIntegratorId,
}

const mockProjects = [mockProject]

describe('Get clients', () => {
  beforeAll(() => {
    getProjects.mockResolvedValue(mockProjects)
  })

  it('Has the correct response structure.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()

    // Act
    await getClientsIntegrator(ctx, request, response)
    const { data } = response._getJSONData()

    // Assert
    expect(data).toHaveLength(mockProjects.length)
    expect(data[0]).toEqual(
      expect.objectContaining({
        attributes: expect.objectContaining({
          integratorId: expect.any(String),
          displayName: expect.any(String),
        }),
        id: expect.any(String),
        type: 'client',
      }),
    )
  })

  it('Should get all clients.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()

    // Act
    await getClientsIntegrator(ctx, request, response)
    const { data: clients } = response._getJSONData()

    const client = clients[0]

    // Assert
    expect(client.id).toBe(testClientId)
    expect(client.attributes.integratorId).toBe(testClientIntegratorId)
    expect(client.attributes.displayName).toBe(testClientDisplayName)
  })

  it('Should add links to the response.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()

    // Act
    await getClientsIntegrator(ctx, request, response)
    const { links } = response._getJSONData()

    // Assert
    expect(links).toEqual(expect.objectContaining({
      self: `${myBaseUrl}/integrator/clients`,
    }))
  })

  it('Should return the correct status code.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()

    // Act
    await getClientsIntegrator(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(200)
  })
})

describe('Get clients failure', () => {
  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    getProjects.mockImplementation(() => {
      throw new Error('Test Error')
    })

    const { ctx, request, response } = mockHttp()

    // Act
    await getClientsIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
