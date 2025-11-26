import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/find_or_create_project', () => ({
  findOrCreateProject: jest.fn(),
}))

jest.unstable_mockModule('../../../core/update_project', () => ({
  default: jest.fn(),
}))

const {
  MY_BASE_URL_FOR_LINKS: myBaseUrl,
} = await import('../../../../config/misc.js')

const { default: addClientIntegrator } = await import('../../integrator/add_client.js')
const { default: mockHttp } = await import('../utils/mock-http.js')

const { findOrCreateProject } = await import('../../../core/find_or_create_project.js')
const { default: updateProject } = await import('../../../core/update_project.js')

const testClientId = 'testClientId'
const testClientIntegratorId = 'Test Client?Integrator/Id&'
const testClientIntegratorIdEncoded = encodeURIComponent(testClientIntegratorId)
const testClientName = 'Test Client Name'

const validRequestParams = {
  clientIntegratorId: testClientIntegratorId,
}
const validRequestBody = {
  displayName: testClientName,
}

const mockProject = {
  id: testClientId,
  integratorId: testClientIntegratorId,
  name: testClientName,
}

describe('Add Client.', () => {
  beforeAll(() => {
    findOrCreateProject.mockResolvedValue(mockProject)
  })

  it('Has the correct response structure.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addClientIntegrator(ctx, request, response)
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

  it('Should add a client.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addClientIntegrator(ctx, request, response)
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
    expect(integratorId).toBe(testClientIntegratorId)
    expect(displayName).toBe(testClientName)
    expect(id).toBe(testClientId)
  })

  it('Should add links to the response.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addClientIntegrator(ctx, request, response)
    const {
      data: { links },
    } = response._getJSONData()

    // Assert
    expect(links).toEqual(expect.objectContaining({
      self: `${myBaseUrl}/integrator/clients/${testClientIntegratorIdEncoded}`,
    }))
  })
})

describe('Client display name update.', () => {
  it('Should update the client display name', async () => {
    // Arrange
    const updatedDisplayName = 'A different display name.'
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = {
      displayName: updatedDisplayName,
    }

    findOrCreateProject.mockResolvedValue({
      ...mockProject,
      created: false,
    })
    updateProject.mockResolvedValue({
      ...mockProject,
      name: updatedDisplayName,
    })

    // Act
    await addClientIntegrator(ctx, request, response)
    const {
      data: {
        attributes: { displayName },
      },
    } = response._getJSONData()

    // Assert
    expect(displayName).toBe(updatedDisplayName)
  })

  it('Should not update the display name if the name is unchanged.', async () => {
    // Arrange
    updateProject.mockClear()

    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    findOrCreateProject.mockResolvedValue({
      ...mockProject,
      created: false,
    })

    // Act
    await addClientIntegrator(ctx, request, response)

    // Assert
    expect(updateProject.mock.calls).toHaveLength(0)
  })

  it('Should not update the display name if the project is just created.', async () => {
    // Arrange
    updateProject.mockClear()

    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = {
      displayName: 'Different Display Name',
    }

    findOrCreateProject.mockResolvedValue({
      ...mockProject,
      created: true,
    })

    // Act
    await addClientIntegrator(ctx, request, response)

    // Assert
    expect(updateProject.mock.calls).toHaveLength(0)
  })
})

describe('Client creation status codes and location', () => {
  it.each([true, false])(
    'Should return the correct status code.',
    async (created) => {
      // Arrange
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      ctx.request.body = validRequestBody

      findOrCreateProject.mockResolvedValue({
        ...mockProject,
        created,
      })

      // Act
      await addClientIntegrator(ctx, request, response)

      // Assert
      expect(response.statusCode).toBe(created ? 201 : 200)
    },
  )

  it.each([true, false])(
    'Should add the location header if the client is created.',
    async (created) => {
      // Arrange
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      ctx.request.body = validRequestBody

      findOrCreateProject.mockResolvedValue({
        ...mockProject,
        created,
      })

      // Act
      await addClientIntegrator(ctx, request, response)

      // Assert
      const expectedLocation = created
        ? `${myBaseUrl}/integrator/clients/${testClientIntegratorIdEncoded}`
        : undefined

      expect(response.getHeader('location')).toBe(expectedLocation)
    },
  )
})

describe('Add client failure', () => {
  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    findOrCreateProject.mockImplementation(() => {
      throw new Error('Test Error')
    })

    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addClientIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
