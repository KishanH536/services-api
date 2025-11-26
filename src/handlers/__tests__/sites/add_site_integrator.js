import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/find_or_create_project', () => ({
  findOrCreateProject: jest.fn(),
}))

jest.unstable_mockModule('../../../core/update_site', () => ({
  default: jest.fn(),
}))

jest.unstable_mockModule('../../../core/find_or_create_site', () => ({
  findOrCreateSite: jest.fn(),
  createSite: jest.fn(),
}))

const {
  MY_BASE_URL_FOR_LINKS: myBaseUrl,
} = await import('../../../../config/misc.js')

const { default: addSiteIntegrator } = await import('../../integrator/add_site.js')
const { default: mockHttp } = await import('../utils/mock-http.js')
const { findOrCreateProject } = await import('../../../core/find_or_create_project.js')
const { default: updateSite } = await import('../../../core/update_site.js')

const {
  findOrCreateSite,
  createSite,
} = await import('../../../core/find_or_create_site.js')

const testClientIntegratorId = 'Test Client?Integrator/Id&'
const testSiteIntegratorId = 'Test Site?Integrator/Id&'
const testClientIntegratorIdEncoded = encodeURIComponent(testClientIntegratorId)
const testSiteIntegratorIdEncoded = encodeURIComponent(testSiteIntegratorId)
const testSiteDisplayName = 'Test Site Display Name'
const testSiteTimeZone = 'Canada/Pacific'

const validRequestParams = {
  clientIntegratorId: testClientIntegratorId,
  siteIntegratorId: testSiteIntegratorId,
}

const validRequestBody = {
  displayName: testSiteDisplayName,
  timeZone: testSiteTimeZone,
}

const mockProject = {
  id: 'testProjectId',
  integratorId: testClientIntegratorId,
  name: 'TestProjectName',
}

const mockSite = {
  id: 'testSiteId',
  integratorId: testSiteIntegratorId,
  name: testSiteDisplayName,
  timeZone: testSiteTimeZone,
}

describe('Add Site.', () => {
  beforeAll(() => {
    findOrCreateProject.mockResolvedValue(mockProject)
    findOrCreateSite.mockResolvedValue(mockSite)
    createSite.mockResolvedValue({
      ...mockSite,
      created: true,
    })
  })

  it('Has the correct response structure.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addSiteIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          attributes: expect.objectContaining({
            displayName: expect.any(String),
            integratorId: expect.any(String),
            timeZone: expect.any(String),
          }),
          id: expect.any(String),
          type: 'site',
          links: expect.any(Object),
        }),
      }),
    )
  })

  it('Should add a site.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addSiteIntegrator(ctx, request, response)
    const {
      data: {
        id,
        attributes: {
          displayName,
          integratorId,
          timeZone,
        },
      },
    } = response._getJSONData()

    // Assert
    expect(displayName).toBe(testSiteDisplayName)
    expect(integratorId).toBe(testSiteIntegratorId)
    expect(timeZone).toBe(testSiteTimeZone)
    expect(id).toBe(mockSite.id)
  })

  it('Should add links to the response.', async () => {
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addSiteIntegrator(ctx, request, response)
    const {
      data: { links },
    } = response._getJSONData()

    // Assert
    expect(links).toEqual(expect.objectContaining({
      self: `${myBaseUrl}/integrator/clients/${testClientIntegratorIdEncoded}/sites/${testSiteIntegratorIdEncoded}`,
    }))
  })
})

describe('Site creation/update, status codes and location', () => {
  beforeAll(() => {
    findOrCreateProject.mockResolvedValue(mockProject)
  })

  it("Should update the time zone if it doesn't match the existing site's timezone.", async () => {
    // Arrange
    const testTimeZone = 'America/Chicago'
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = {
      ...validRequestBody,
      timeZone: testTimeZone,
    }

    findOrCreateSite.mockResolvedValue({
      created: false,
      ...mockSite,
    })

    updateSite.mockResolvedValue({
      id: mockSite.id,
      name: mockSite.name,
      timeZone: testTimeZone,
    })

    // Act
    await addSiteIntegrator(ctx, request, response)

    const {
      data: {
        attributes: {
          timeZone,
        },
      },
    } = response._getJSONData()

    // Assert
    // updateSite arguments are (0) userId, (1) siteId, (2) siteName, (3) timeZone
    expect(updateSite.mock.calls.pop()[3]).toBe(testTimeZone)
    expect(timeZone).toBe(testTimeZone)
  })

  it.each([
    ['New Site Name', 'America/Chicago', true],
    [testSiteDisplayName, 'America/Chicago', true],
    ['New Site Name', testSiteTimeZone, true],
    [testSiteDisplayName, testSiteTimeZone, false],
  ])(
    'Should only update the site if the site name and time zone do not match the existing.',
    async (displayName, timeZone, shouldUpdate) => {
      // Arrange
      updateSite.mockClear()
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      ctx.request.body = {
        displayName,
        timeZone,
      }

      findOrCreateSite.mockResolvedValue(mockSite)

      // Act
      await addSiteIntegrator(ctx, request, response)

      // Assert
      expect(updateSite.mock.calls).toHaveLength(shouldUpdate ? 1 : 0)
    },
  )

  it.each([true, false])(
    'Should return the correct status code if the site was created.',
    async (created) => {
      // Arrange
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      ctx.request.body = validRequestBody

      findOrCreateSite.mockResolvedValue({
        created,
        ...mockSite,
      })

      // Act
      await addSiteIntegrator(ctx, request, response)

      // Assert
      expect(response.statusCode).toBe(created ? 201 : 200)
    },
  )

  it.each([true, false])(
    'Should add the location header if the site was created.',
    async (created) => {
      // Arrange
      const { ctx, request, response } = mockHttp()
      ctx.request.params = validRequestParams
      ctx.request.body = validRequestBody

      findOrCreateSite.mockResolvedValue({
        created,
        ...mockSite,
      })

      // Act
      await addSiteIntegrator(ctx, request, response)

      // Assert
      const expectedLocation = created
        ? `${myBaseUrl}/integrator/clients/${testClientIntegratorIdEncoded}/sites/${testSiteIntegratorIdEncoded}`
        : undefined

      expect(response.getHeader('location')).toBe(expectedLocation)
    },
  )
})

describe('Add site failure', () => {
  it('Should send an internal server error if the handler errors.', async () => {
    // Arrange
    findOrCreateProject.mockResolvedValue(mockProject)
    findOrCreateSite.mockImplementation(() => {
      throw new Error('Test Error')
    })

    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams
    ctx.request.body = validRequestBody

    // Act
    await addSiteIntegrator(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
