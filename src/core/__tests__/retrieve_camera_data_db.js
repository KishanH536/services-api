import { jest } from '@jest/globals'

const testCameraIntegratorId = 'test-camera-integrator-id'
const testSiteIntegratorId = 'test-site-integrator-id'
const testProjectIntegratorId = 'test-project-integrator-id'

// Bring in DB creation and helper functions
jest.unstable_mockModule('../../db', () => ({ initDB: jest.fn() }))

jest.unstable_mockModule('../add_analytics_to_view', () => ({
  default: jest.fn(),
}))

const { getView: retrieveCameraData } = await import('../retrieve_camera_data.js')
const { initDB: mockInitDB } = await import('../../db/index.js')

const { default: initDB } = await import('./utils/init_db.js')
const {
  createCompany,
  createUser,
  createProject,
  createSite,
  createView,
  deleteView,
} = await import('./utils/db_crud.js')

describe('Get camera data Calipsa', () => {
  let sql
  let testCompanyId
  let testUserId
  let testProjectId
  let testSiteId
  let testViewId

  async function setupDB() {
    sql = await initDB()

    const testCompany = await createCompany(sql, {})
    testCompanyId = testCompany.id

    const testUser = await createUser(sql, { companyId: testCompanyId })
    testUserId = testUser.id

    const testProject = await createProject(sql, {
      companyId: testCompanyId,
      integratorId: testProjectIntegratorId,
    })
    testProjectId = testProject.id

    const testSite = await createSite(sql, {
      userId: testUserId,
      projectId: testProjectId,
      integratorId: testSiteIntegratorId,
    })
    testSiteId = testSite.site.id

    const testView = await createView(sql, {
      userId: testUserId,
      siteId: testSiteId,
      integratorId: testCameraIntegratorId,
      companyId: testCompanyId,
      status: { active: true },
    })
    testViewId = testView.view.id

    mockInitDB.mockResolvedValue(sql)
  }

  beforeAll(setupDB)

  afterAll(async () => {
    await sql.close()
  })

  it('Should get the camera data (calipsa query)', async () => {
    // Act
    const camera = await retrieveCameraData(testUserId, testViewId, 'calipsa')

    // Assert
    expect(camera).toEqual(
      expect.objectContaining({ viewId: testViewId }),
    )
  })

  it('Should get the camera data (integrator query)', async () => {
    // Act
    const camera = await retrieveCameraData(testUserId, testCameraIntegratorId, 'integrator')

    // Assert
    expect(camera).toEqual(
      expect.objectContaining({ viewId: testViewId }),
    )
  })

  it('Should return null if there is no view (calipsa query)', async () => {
    // Arrange
    await deleteView(sql, testViewId)

    // Act
    const camera = await retrieveCameraData(testUserId, testViewId, 'calipsa')

    // Assert
    expect(camera).toBeNull()
  })

  it('Should return null if there is no view (integrator query)', async () => {
    // Act
    const camera = await retrieveCameraData(testUserId, testCameraIntegratorId, 'integrator')

    // Assert
    expect(camera).toBeNull()
  })
})
