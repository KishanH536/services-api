import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/find_or_create_project', () => ({
  createProject: jest.fn(),
}))

const {
  MY_BASE_URL_FOR_LINKS: myBaseUrl,
} = await import('../../../../config/misc.js')

const { default: addClientCalipsa } = await import('../../calipsa/add_client.js')
const { default: mockHttp } = await import('../utils/mock-http.js')
const { createProject } = await import('../../../core/find_or_create_project.js')

const testClientId = 'testClientId'
const testClientName = 'testClientName'

const validRequestBody = {
  displayName: testClientName,
}

const mockProject = {
  id: testClientId,
  integratorId: null,
  name: testClientName,
  created: true,
}

describe('Add Client.', () => {
  beforeAll(() => {
    createProject.mockResolvedValue(mockProject)
  })

  it('Has the correct response structure.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.body = validRequestBody

    // Act
    await addClientCalipsa(ctx, request, response)
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

  it('Should add a client.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.body = validRequestBody

    // Act
    await addClientCalipsa(ctx, request, response)
    const {
      data: {
        id,
        attributes: {
          displayName,
        },
      },
    } = response._getJSONData()

    // Assert
    expect(displayName).toBe(testClientName)
    expect(id).toBe(testClientId)
  })

  it('Should add links to the response.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.body = validRequestBody

    // Act
    await addClientCalipsa(ctx, request, response)
    const {
      data: { links },
    } = response._getJSONData()

    // Assert
    expect(links).toEqual(expect.objectContaining({
      self: `${myBaseUrl}/clients/${testClientId}`,
    }))
  })
})

describe('Client creation status codes and location', () => {
  it(
    'Should always create the client.',
    async () => {
      // Arrange
      const { ctx, request, response } = mockHttp()
      ctx.request.body = validRequestBody

      createProject.mockResolvedValue(mockProject)

      // Act
      await addClientCalipsa(ctx, request, response)

      // Assert
      expect(response.statusCode).toBe(201)
    },
  )

  it(
    'Should always add the location header.',
    async () => {
      // Arrange
      const { ctx, request, response } = mockHttp()
      ctx.request.body = validRequestBody

      createProject.mockResolvedValue(mockProject)

      // Act
      await addClientCalipsa(ctx, request, response)

      // Assert
      const expectedLocation = `${myBaseUrl}/clients/${testClientId}`
      expect(response.getHeader('location')).toBe(expectedLocation)
    },
  )
})

describe('Add client failure', () => {
  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    createProject.mockImplementation(() => {
      throw new Error('Test Error')
    })

    const { ctx, request, response } = mockHttp()
    ctx.request.body = validRequestBody

    // Act
    await addClientCalipsa(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
