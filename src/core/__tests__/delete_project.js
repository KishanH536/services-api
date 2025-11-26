import { jest } from '@jest/globals'

jest.unstable_mockModule('../get_project', () => ({
  default: jest.fn(),
}))
jest.unstable_mockModule('../find_project_by_integrator_id', () => ({
  default: jest.fn(),
}))

jest.unstable_mockModule('../get_sites', () => ({
  getSitesByClientId: jest.fn(() => []),
}))

jest.unstable_mockModule('../clean_and_delete_views', () => ({
  cleanAndDeleteViews: jest.fn(),
}))

const mockSiteCurrent = jest.fn()
const mockProjectUpdate = jest.fn()
const mockViewFindAll = jest.fn().mockResolvedValue([{ id: 'id1' }, { id: 'id2' }])

jest.unstable_mockModule('../../db', () => ({
  initDB: jest.fn().mockImplementation(() => ({
    literal: jest.fn(),
    transaction: jest.fn().mockImplementation((fn) => fn()),
    models: {
      viewCurrent: {
        findAll: mockViewFindAll,
      },
      site: {
        update: mockSiteCurrent,
      },
      project: {
        update: mockProjectUpdate,
      },
    },
  })),
}))

const { default: getProjectById } = await import('../get_project.js')
const { default: getProjectByIntegratorId } = await import('../find_project_by_integrator_id.js')
const { cleanAndDeleteViews } = await import('../clean_and_delete_views.js')

const {
  softDeleteClientById,
  softDeleteClientByIntegratorId,
} = await import('../delete_project.js')

const testCompanyId = '6982f4e5-c14e-4680-b06c-02ad224e8f96'
const testUserId = '3d982b5d-e748-45fb-b2a3-5a089fbc68fe'
const testClientId = '3c0e81cb-29dd-4dce-8ba1-f5d34b146484'
const testClientIntegratorId = 'test-client-integrator-id'
const testClient = {
  id: testClientId,
}

describe.each([
  [softDeleteClientById, getProjectById, testClientId],
  [softDeleteClientByIntegratorId, getProjectByIntegratorId, testClientIntegratorId],
])('Delete a client by ID', (softDeleteClient, getProject, id) => {
  it("Returns null if the client doesn't exist or is deleted.", async () => {
    // Arrange
    getProject.mockResolvedValue(null)

    // Act
    const client = await softDeleteClient(testUserId, testCompanyId, id)

    // Assert
    expect(client).toBeNull()
  })

  it('Returns null if the client was not updated.', async () => {
    // Arrange
    getProject.mockResolvedValue(testClient)
    mockProjectUpdate.mockResolvedValue([0, []])

    // Act
    const client = await softDeleteClient(testUserId, testCompanyId, id)

    // Assert
    expect(client).toBeNull()
  })

  it('Returns the updated client if the client was updated.', async () => {
    // Arrange
    const now = Date.now()
    getProject.mockResolvedValue(testClient)
    mockProjectUpdate.mockResolvedValue([1, [{
      ...testClient,
      deletedAt: now,
    }]])

    // Act
    const client = await softDeleteClient(testUserId, testCompanyId, id)

    // Assert
    expect(client.deletedAt).toBe(now)
  })

  it('Should delete sites and views that are associated with the company', async () => {
    // Arrange
    getProject.mockResolvedValue(testClient)
    cleanAndDeleteViews.mockClear()
    mockSiteCurrent.mockClear()

    // Act
    await softDeleteClient(testUserId, testCompanyId, id)

    // Assert
    expect(cleanAndDeleteViews.mock.calls).toHaveLength(1)
    expect(mockSiteCurrent.mock.calls).toHaveLength(1)
  })
})
