import { jest } from '@jest/globals'

const testSiteName = 'test-site-name'
const testSiteIntegratorId = 'test-site-integrator-id'

const testTimeZone = 'America/Chicago'

// Bring in DB creation and helper functions
jest.unstable_mockModule('../../db', () => ({ initDB: jest.fn() }))

const { initDB: mockInitDB } = await import('../../db/index.js')
const { default: initDB } = await import('./utils/init_db.js')

const {
  createCompany,
  createUser,
  createProject,
  createSite: preCreateSite,
  deleteSite,
} = await import('./utils/db_crud.js')

const {
  createSite,
  findOrCreateSite,
} = await import('../find_or_create_site.js')

describe('Create a site', () => {
  let sql
  let testCompanyId
  let testUserId
  let testProjectId

  async function setupDB() {
    sql = await initDB()

    const testCompany = await createCompany(sql, { })
    testCompanyId = testCompany.id

    const testUser = await createUser(sql, { companyId: testCompanyId })
    const testProject = await createProject(sql, { companyId: testCompanyId })
    testUserId = testUser.id
    testProjectId = testProject.id

    mockInitDB.mockResolvedValue(sql)
  }

  beforeAll(setupDB)
  afterAll(async () => {
    await sql.close()
  })

  it('Should return the created site with the timezone specified', async () => {
    // Act
    const site = await createSite(
      testProjectId,
      testUserId,
      testSiteIntegratorId,
      testSiteName,
      testTimeZone,
    )

    // Assert
    expect(site).toEqual(
      expect.objectContaining({
        id: expect.anyUuid(),
        integratorId: testSiteIntegratorId,
        name: testSiteName,
        created: true,
        timeZone: testTimeZone,
      }),
    )
  })

  it('Should use the integrator ID for the site name if site name is not provided', async () => {
    // Act
    const site = await createSite(
      testProjectId,
      testUserId,
      testSiteIntegratorId,
      /* siteName */ null,
      testTimeZone,
    )

    // Assert
    expect(site).toEqual(
      expect.objectContaining({
        id: expect.anyUuid(),
        integratorId: testSiteIntegratorId,
        name: testSiteIntegratorId,
        created: true,
        timeZone: testTimeZone,
      }),
    )
  })
})

describe('Find or Create a site', () => {
  let sql
  let testCompanyId
  let testUserId
  let testProjectId
  let testSiteId

  async function setupDB() {
    sql = await initDB()

    const testCompany = await createCompany(sql, { })
    testCompanyId = testCompany.id

    const testUser = await createUser(sql, { companyId: testCompanyId })
    const testProject = await createProject(sql, { companyId: testCompanyId })
    testUserId = testUser.id
    testProjectId = testProject.id

    mockInitDB.mockResolvedValue(sql)
  }

  beforeAll(setupDB)
  afterAll(async () => {
    await sql.close()
  })

  it('Should use the integrator ID for the site name if site name is not provided', async () => {
    // Act
    const site = await findOrCreateSite(
      testCompanyId,
      testProjectId,
      testUserId,
      testSiteIntegratorId,
      /* siteName */ null,
      testTimeZone,
    )

    // Assert
    expect(site).toEqual(
      expect.objectContaining({
        id: expect.anyUuid(),
        integratorId: testSiteIntegratorId,
        name: testSiteIntegratorId,
        created: true,
        timeZone: testTimeZone,
      }),
    )
    await deleteSite(sql, site.id)
  })

  it('Should return the site if it finds it', async () => {
    // Arrange
    const testSite = await preCreateSite(sql, {
      userId: testUserId,
      projectId: testProjectId,
      integratorId: testSiteIntegratorId,
    })
    testSiteId = testSite.site.id

    // Act
    const site = await findOrCreateSite(
      testCompanyId,
      testProjectId,
      testUserId,
      testSiteIntegratorId,
    )

    // Assert
    expect(site).toEqual(
      expect.objectContaining({
        id: testSiteId,
        integratorId: testSiteIntegratorId,
        created: false,
      }),
    )
    await deleteSite(sql, site.id)
  })

  it('Should return the site if it finds it', async () => {
    // Arrange

    // Act
    const site = await findOrCreateSite(
      testCompanyId,
      testProjectId,
      testUserId,
      testSiteIntegratorId,
    )

    // Assert
    expect(site).toEqual(
      expect.objectContaining({
        id: expect.anyUuid(),
        integratorId: testSiteIntegratorId,
        created: true,
      }),
    )
    await deleteSite(sql, site.id)
  })
})
