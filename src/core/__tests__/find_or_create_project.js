import { jest } from '@jest/globals'

const testCompanyId = 'test-company-id'
const testProjectId = 'test-project-id'
const testProjectIntegratorId = 'test-project-integrator-id'
const testProjectName = 'test-project-name'
const testProject = {
  id: testProjectId,
  integratorId: testProjectIntegratorId,
  name: testProjectName,
}

const mockDbFindOrCreate = jest.fn()

const mockInitDB = jest.fn().mockImplementation(() => ({
  models: {
    project: {
      findOrCreate: mockDbFindOrCreate,
    },
  },
}))

jest.unstable_mockModule('../../db', () => ({ initDB: mockInitDB }))

const { findOrCreateProject } = await import('../find_or_create_project.js')

describe('Create a project', () => {
  afterEach(() => {
    mockDbFindOrCreate.mockClear()
  })

  it('Should call the DB function to find or create the project', async () => {
    // Arrange
    mockDbFindOrCreate.mockResolvedValueOnce([testProject, true])

    // Act
    await findOrCreateProject(testCompanyId, testProjectName)

    // Assert
    expect(mockDbFindOrCreate.mock.calls).toHaveLength(1)
  })

  it('Should provide the correct parameters to the DB function.', async () => {
    // Arrange
    mockDbFindOrCreate.mockResolvedValueOnce([testProject, true])

    // Act
    await findOrCreateProject(testCompanyId, testProjectIntegratorId, testProjectName)

    // Assert
    const {
      where: { companyId, integratorId },
      defaults: { name },
    } = mockDbFindOrCreate.mock.calls[0][0]

    expect(companyId).toBe(testCompanyId)
    expect(integratorId).toBe(testProjectIntegratorId)
    expect(name).toBe(testProjectName)
  })

  it.each([true, false])(
    'Should return either the created or existing project',
    async (created) => {
      // Arrange
      mockDbFindOrCreate.mockResolvedValueOnce([testProject, created])

      // Act
      const project = await findOrCreateProject(testCompanyId, testProjectName)

      // Assert
      expect(project).toEqual(
        expect.objectContaining({
          id: testProjectId,
          name: testProjectName,
          created,
        }),
      )
    },
  )
})
