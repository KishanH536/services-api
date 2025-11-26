import { Site } from '../index.js'

const testClientId = 'testClientId'
const mockSite = {
  calipsaSiteId: 'testSiteId',
  integratorId: 'testIntegratorId',
  name: 'testDisplayName',
  timezone: 'testTimeZone',
}
const mockSiteWithCompany = {
  ...mockSite,
}
const mockSites = [mockSite]
const mockSitesWithCompany = [mockSiteWithCompany]

describe('Render JSON:API response bodies for multiple sites', () => {
  it('Should create a response body with the correct structure, with no related resources', () => {
    // Act
    const responseBody = Site.render(mockSites, testClientId)

    // Assert
    expect(responseBody).toEqual(expect.objectContaining({
      links: expect.any(Object),
      data: [
        expect.not.objectContaining({
          relationships: expect.any(Object),
        }),
      ],
    }))
  })

  it('Should create a response body with the correct structure, with related resources', () => {
    // Act
    const responseBody = Site.render(mockSitesWithCompany, testClientId)

    // Assert
    expect(responseBody).toEqual(expect.objectContaining({
      links: expect.any(Object),
      data: [
        expect.objectContaining({
          id: expect.any(String),
          type: expect.any(String),
          links: expect.any(Object),
          attributes: expect.any(Object),
        }),
      ],
    }))
  })
})

describe('Render JSON:API response bodies for a single site', () => {
  it('Should create a response body with the correct structure', () => {
    // Act
    const responseBody = Site.render(mockSite, testClientId)

    // Assert
    expect(responseBody).toEqual(expect.objectContaining({
      data: expect.objectContaining({
        id: expect.any(String),
        type: expect.any(String),
        attributes: expect.any(Object),
      }),
    }))
  })
})
