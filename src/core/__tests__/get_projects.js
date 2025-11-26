import { jest } from '@jest/globals'

const testUserId = 'b05da68e-93a9-49f2-9c18-7a34519fdbfd'
const testCompanyId = 'ad6b89c6-9c2d-4d79-a677-8641cb9deece'
const testClientId = 'd7ab3203-3540-4a58-bbe8-1c851108667d'
const testClientIntegratorId = 'test-client-integrator-id'

const mockProjects = [{
  id: testClientId,
  integratorId: testClientIntegratorId,
}]

const mockDbQuery = jest.fn(() => mockProjects)

jest.unstable_mockModule('../../db', () => ({
  initDB: jest.fn().mockImplementation(() => ({
    query: mockDbQuery,
  })),
}))

const { default: getProjects } = await import('../get_projects.js')

describe('Get projects by company ID', () => {
  afterEach(() => {
    mockDbQuery.mockClear()
  })

  it('Should call the DB function to get the projects', async () => {
    // Act
    await getProjects(testUserId, testCompanyId)

    // Assert
    expect(mockDbQuery.mock.calls).toHaveLength(1)
  })

  it('Should provide the correct parameters to the DB function.', async () => {
    // Act
    await getProjects(testUserId, testCompanyId)

    // Assert
    const {
      replacements: { userId, companyId },
    } = mockDbQuery.mock.lastCall[1]

    expect(userId).toBe(testUserId)
    expect(companyId).toBe(testCompanyId)
  })

  it('Should get the projects', async () => {
    // Act
    const projects = await getProjects(testUserId, testCompanyId)

    // Assert
    expect(projects).toHaveLength(mockProjects.length)
    expect(projects[0].id).toBe(testClientId)
  })
})
