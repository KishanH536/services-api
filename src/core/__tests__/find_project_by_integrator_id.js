import { jest } from '@jest/globals'

const testCompanyId = 'b7e784f2-fde2-48c2-94ed-49add12e9242'
const testClientIntegratorId = 'test-client-integrator-id'
const testProjectId = '210debd9-d537-443c-b2e8-57642a3cd91c'
const testProjectName = 'test-project-name'

const mockProject = {
  id: testProjectId,
  name: testProjectName,
}

const mockFindOneProject = jest.fn(() => mockProject)

jest.unstable_mockModule('../../db', () => ({
  initDB: jest.fn().mockImplementation(() => ({
    models: {
      project: {
        findOne: mockFindOneProject,
      },
    },
  })),
}))

const {
  default: findProjectByIntegratorId,
} = await import('../find_project_by_integrator_id.js')

describe('Find a project', () => {
  afterEach(() => {
    mockFindOneProject.mockClear()
  })

  it('Should call the DB function to get the project', async () => {
    // Act
    await findProjectByIntegratorId(testCompanyId, testClientIntegratorId)

    // Assert
    expect(mockFindOneProject.mock.calls).toHaveLength(1)
  })

  it('Should provide the correct parameters to the DB function.', async () => {
    // Act
    await findProjectByIntegratorId(testCompanyId, testClientIntegratorId)

    // Assert
    const {
      where: {
        companyId,
        integratorId,
      },
    } = mockFindOneProject.mock.calls[0][0]

    expect(companyId).toBe(testCompanyId)
    expect(integratorId).toBe(testClientIntegratorId)
  })

  it('Should get the project', async () => {
    // Act
    const project = await findProjectByIntegratorId(testCompanyId, testClientIntegratorId)

    // Assert
    expect(project).toEqual(
      expect.objectContaining({ id: testProjectId }),
    )
  })
})
