import { jest } from '@jest/globals'

const testUserId = 'test-user-id'
const testCompanyId = 'test-company-id'
const testSiteId = 'test-site-id'
const testTokenId = 'test-token-id'
const testViewIntegratorId = 'test-camera-integrator-id'
const testCreatedViewId = '79f815ce-5880-4fd2-99d3-ce6c138bb060'
const testViewId = 'f630647b-6822-4d11-acbc-eb3f8f67e221'
const testViewName = 'Test View Name'

const testView = {
  siteId: testSiteId,
  integratorId: testViewIntegratorId,
}

const testViewCurrent = {
  name: testViewName,
  tokenId: testTokenId,
  mask: [],
  isSnapshot: false,
  isThermal: null,
}

const testCreatedView = {
  ...testView,
  id: testCreatedViewId,
}

const testCreatedViewCurrent = {
  ...testViewCurrent,
  id: testCreatedViewId,
}

const mockViewCreate = jest.fn()
const mockViewUpdate = jest.fn()
const mockViewCurrentCreate = jest.fn()
const mockViewCurrentUpdate = jest.fn()
const mockAnalyticsFindAll = jest.fn()
const mockQuery = jest.fn()

jest.unstable_mockModule('../../db', () => ({
  initDB: jest.fn().mockImplementation(() => ({
    query: mockQuery,
    transaction: (fn) => fn(),
    models: {
      view: {
        create: mockViewCreate,
        update: mockViewUpdate,
      },
      viewCurrent: {
        create: mockViewCurrentCreate,
        update: mockViewCurrentUpdate,
      },
      analytics: {
        findAll: mockAnalyticsFindAll,
      },
    },
  })),
}))

const {
  createView,
  updateView,
} = await import('../create_or_update_camera.js')

describe('Create View', () => {
  beforeEach(() => {
    mockViewCreate.mockClear()
    mockViewCurrentCreate.mockClear()
    mockViewCreate.mockResolvedValueOnce(testCreatedView)
    mockViewCurrentCreate.mockResolvedValueOnce(testCreatedViewCurrent)
  })

  it('Creates a new view.', async () => {
    // Act
    const view = await createView(
      testUserId,
      testSiteId,
      {
        viewName: testViewName,
        cameraIntegratorId: testViewIntegratorId,
      },
    )

    // Assert
    expect(view.calipsaViewId).toBe(testCreatedViewId)
    expect(view.integratorId).toBe(testViewIntegratorId)
    expect(view.created).toBe(true)
  })

  it('Creates a new view current.', async () => {
    // Act
    const view = await createView(
      testUserId,
      testSiteId,
      {
        viewName: testViewName,
        cameraIntegratorId: testViewIntegratorId,
      },
    )

    // Assert
    expect(view.name).toBe(testViewName)
    expect(view.masks).toHaveLength(0)
    expect(view.snapshotSet).toBe(false)
    expect(view.thermal).toBe(false)
  })

  it("Doesn't set object detection unless explicitly specified", async () => {
    // Act
    await createView(
      testUserId,
      testSiteId,
      {
        viewName: testViewName,
        cameraIntegratorId: testViewIntegratorId,
      },
    )

    // Assert
    expect(mockViewCurrentCreate.mock.lastCall[0]).toEqual(
      expect.objectContaining({ status: expect.any(Object) }),
    )

    expect(mockViewCurrentCreate.mock.lastCall[0].status)
      .not
      .toHaveProperty('isObjectDetection')
  })

  it.each([false, true])(
    'Creates a view update with the correct object detection status',
    async (objectDetection) => {
      // Act
      await createView(
        testUserId,
        testSiteId,
        {
          viewName: testViewName,
          cameraIntegratorId: testViewIntegratorId,
          objectDetection,
        },
      )

      // Assert
      expect(mockViewCurrentCreate.mock.lastCall[0]).toEqual(
        expect.objectContaining({
          status: expect.objectContaining({
            isObjectDetection: objectDetection,
          }),
        }),
      )
    },
  )
})

describe('Update View', () => {
  beforeEach(() => {
    mockQuery.mockClear()
    mockViewUpdate.mockClear()
    mockViewCurrentUpdate.mockClear()
    mockAnalyticsFindAll.mockClear()
    mockAnalyticsFindAll.mockResolvedValue([])
  })

  it("Doesn't update a view if it doesn't find it", async () => {
    mockQuery.mockResolvedValueOnce(null)

    const view = await updateView(testCompanyId, testUserId, testViewId, {
      viewName: 'new-view-name',
      siteId: 'new-site-id',
      masks: [],
    })

    expect(view).toBe(undefined)
    expect(mockViewCurrentUpdate.mock.calls).toHaveLength(0)
  })

  it("Doesn't update a view if the site ID hasn't changed", async () => {
    mockQuery.mockResolvedValueOnce([testCreatedView])

    await updateView(testCompanyId, testUserId, testViewId, {
      viewName: 'new-view-name',
      siteId: testSiteId,
      masks: [],
    })

    expect(mockViewUpdate.mock.calls).toHaveLength(0)
  })

  it.each([
    ['new-view-name', []],
    [testViewName, [[[0, 0], [1, 1], [0, 1]]]],
    ['new-view-name', [[[0, 0], [1, 1], [0, 1]]]],
  ])(
    'Updates a view current if its properties have changed',
    async (name, masks) => {
      mockQuery.mockResolvedValueOnce([{
        ...testCreatedView,
        ...testCreatedViewCurrent,
      }])

      await updateView(testCompanyId, testUserId, testViewId, {
        viewName: name,
        siteId: testSiteId,
        masks,
      })

      expect(mockViewCurrentUpdate.mock.calls).toHaveLength(1)
    },
  )

  it("Doesn't update a view current if its properties have not changed", async () => {
    mockQuery.mockResolvedValueOnce([{
      ...testCreatedView,
      ...testCreatedViewCurrent,
    }])

    await updateView(testCompanyId, testUserId, testViewId, {
      viewName: testViewName,
      siteId: testSiteId,
      masks: [],
    })

    expect(mockViewUpdate.mock.calls).toHaveLength(0)
  })
})
