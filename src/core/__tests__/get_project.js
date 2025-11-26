import { jest } from '@jest/globals'

const testCompanyId = 'test-company-id'
const testProjectId = 'test-project-id'
const testProjectName = 'test-project-name'
const testProject = {
  id: testProjectId,
  name: testProjectName,
}

const mockDbFindOne = jest.fn()

jest.unstable_mockModule('../../db', () => ({
  initDB: jest.fn().mockImplementation(() => ({
    models: {
      project: {
        findOne: mockDbFindOne,
      },
    },
  })),
}))

const {
  default: getProject,
} = await import('../get_project.js')

describe('Find a project', () => {
  afterEach(() => {
    mockDbFindOne.mockClear()
  })

  it('Should call the DB function to get the project', async () => {
    // Act
    await getProject(testCompanyId, testProjectId)

    // Assert
    expect(mockDbFindOne.mock.calls).toHaveLength(1)
  })

  it('Should provide the correct parameters to the DB function.', async () => {
    // Act
    await getProject(testCompanyId, testProjectId)

    // Assert
    const {
      where: { companyId, id },
    } = mockDbFindOne.mock.calls[0][0]

    expect(companyId).toBe(testCompanyId)
    expect(id).toBe(testProjectId)
  })

  it('Should get the project', async () => {
    // Arrange
    mockDbFindOne.mockResolvedValueOnce(testProject)

    // Act
    const project = await getProject(testCompanyId, testProjectId)

    // Assert
    expect(project).toEqual(
      expect.objectContaining({
        id: testProjectId,
        name: testProjectName,
      }),
    )
  })
})
