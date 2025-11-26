import { jest } from '@jest/globals'

const testUserId = 'b05da68e-93a9-49f2-9c18-7a34519fdbfd'
const testClientId = 'd7ab3203-3540-4a58-bbe8-1c851108667d'
const testSiteId = 'e2a764a1-0d69-4e46-a271-1a2ff1e4f4bb'
const testClientIntegratorId = 'test-client-integrator-id'
const testSiteIntegratorId = 'test-site-integrator-id'

const mockSites = [{
  calipsaSiteId: testSiteId,
  integratorId: testSiteIntegratorId,
}]

const mockDbQuery = jest.fn(() => mockSites)

jest.unstable_mockModule('../../db', () => ({
  initDB: jest.fn().mockImplementation(() => ({
    query: mockDbQuery,
  })),
}))

const {
  getSitesByClientIntegratorId,
  getSitesByClientId,
} = await import('../get_sites.js')

describe('Get sites by client integrator ID', () => {
  afterEach(() => {
    mockDbQuery.mockClear()
  })

  it('Should call the DB function to get the sites', async () => {
    // Act
    await getSitesByClientIntegratorId(testUserId, testClientIntegratorId)

    // Assert
    expect(mockDbQuery.mock.calls).toHaveLength(1)
  })

  it('Should provide the correct parameters to the DB function.', async () => {
    // Act
    await getSitesByClientIntegratorId(testUserId, testClientIntegratorId)

    // Assert
    const {
      replacements: { userId, clientIntegratorId },
    } = mockDbQuery.mock.lastCall[1]

    expect(userId).toBe(testUserId)
    expect(clientIntegratorId).toBe(testClientIntegratorId)
  })

  it('Should get the sites', async () => {
    // Act
    const sites = await getSitesByClientIntegratorId(testUserId, testClientIntegratorId)

    // Assert
    expect(sites).toHaveLength(mockSites.length)
    expect(sites[0].calipsaSiteId).toBe(testSiteId)
  })
})

describe('Get sites by client ID', () => {
  afterEach(() => {
    mockDbQuery.mockClear()
  })

  it('Should call the DB function to get the sites', async () => {
    // Act
    await getSitesByClientId(testUserId, testClientId)

    // Assert
    expect(mockDbQuery.mock.calls).toHaveLength(1)
  })

  it('Should provide the correct parameters to the DB function.', async () => {
    // Act
    await getSitesByClientId(testUserId, testClientId)

    // Assert
    const {
      replacements: { userId, clientId },
    } = mockDbQuery.mock.lastCall[1]

    expect(userId).toBe(testUserId)
    expect(clientId).toBe(testClientId)
  })

  it('Should get the sites', async () => {
    // Act
    const sites = await getSitesByClientId(testUserId, testClientId)

    // Assert
    expect(sites).toHaveLength(mockSites.length)
    expect(sites[0].calipsaSiteId).toEqual(testSiteId)
  })
})
