import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/get_project', () => ({
  default: jest.fn(),
}))

jest.unstable_mockModule('../../../core/get_sites', () => ({
  getSitesByClientId: jest.fn(),
}))

const {
  MY_BASE_URL_FOR_LINKS: myBaseUrl,
} = await import('../../../../config/misc.js')

const { Site } = await import('../../../api/serializers/index.js')
const { default: getSitesCalipsa } = await import('../../calipsa/get_sites.js')
const { default: mockHttp } = await import('../utils/mock-http.js')

const { default: getProject } = await import('../../../core/get_project.js')
const { getSitesByClientId } = await import('../../../core/get_sites.js')

const testClientId = 'b1b6f619-7cd5-470e-bb4e-2dffedbd9963'
const testSiteId = 'f5b6296a-a1bd-4bef-ad7b-89409734ab9b'
const testSiteIntegratorId = 'test-site-integrator-id'
const testCompanyId = 'dae55d00-ea35-414b-9aee-c0dc668bc27b'
const testCompanyName = 'testCompanyName'
const testSiteDisplayName = 'test-site-display-name'
const testSiteTimeZone = 'Canada/Pacific'

const validRequestParams = {
  clientId: testClientId,
}

const mockProject = {
  id: testClientId,
}

const mockCompany = {
  id: testCompanyId,
  name: testCompanyName,
}

const mockSite = {
  calipsaSiteId: testSiteId,
  integratorId: testSiteIntegratorId,
  name: testSiteDisplayName,
  timeZone: testSiteTimeZone,
  companies: [mockCompany],
}

const mockSites = [mockSite]

const sitesToBeSerialized = mockSites.map(site => {
  const siteToSerialize = site
  return siteToSerialize
})

describe('Request Errors', () => {
  it('Should return not found if the client is not found', async () => {
    // Arrange
    getProject.mockResolvedValue(null)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSitesCalipsa(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(response.statusCode).toBe(404)
    expect(data.errors[0].status).toBe('404')
  })
})

describe('Get sites', () => {
  beforeAll(() => {
    getProject.mockResolvedValue(mockProject)
  })

  it('Has the correct response structure.', async () => {
    // Arrange
    getSitesByClientId.mockResolvedValue(mockSites)
    const expectedResponseBody = Site.render(sitesToBeSerialized, testClientId)
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSitesCalipsa(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.data).toHaveLength(mockSites.length)
    expect(data).toEqual(expectedResponseBody)
  })

  it('Should return an empty array if there are no sites', async () => {
    // Arrange
    getSitesByClientId.mockResolvedValue([])
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSitesCalipsa(ctx, request, response)
    const { data: sites } = response._getJSONData()

    // Assert
    expect(sites).toHaveLength(0)
  })

  it('Should get all sites.', async () => {
    getSitesByClientId.mockResolvedValue(mockSites)
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSitesCalipsa(ctx, request, response)
    const { data: sites } = response._getJSONData()

    const site = sites[0]

    // Assert
    expect(site.id).toBe(testSiteId)
    expect(site.attributes.integratorId).toBe(testSiteIntegratorId)
    expect(site.attributes.displayName).toBe(testSiteDisplayName)
    expect(site.attributes.timeZone).toBe(testSiteTimeZone)
  })

  it('Should add links to the response.', async () => {
    getSitesByClientId.mockResolvedValue(mockSites)
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSitesCalipsa(ctx, request, response)
    const { links } = response._getJSONData()

    // Assert
    expect(links).toEqual(expect.objectContaining({
      self: `${myBaseUrl}/clients/${testClientId}/sites`,
    }))
  })

  it('Should return the correct status code.', async () => {
    getSitesByClientId.mockResolvedValue(mockSites)
    // Arrange
    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSitesCalipsa(ctx, request, response)

    // Assert
    expect(response.statusCode).toBe(200)
  })
})

describe('Get client failure', () => {
  it('Should send an internal server error if getProject errors.', async () => {
    // Arrange
    getProject.mockImplementation(() => {
      throw new Error('Test Error')
    })

    const { ctx, request, response } = mockHttp()
    ctx.request.params = validRequestParams

    // Act
    await getSitesCalipsa(ctx, request, response)
    const data = response._getJSONData()

    // Assert
    expect(data.errors[0].detail).toBe('Internal Server Error')
    expect(response.statusCode).toBe(500)
  })
})
