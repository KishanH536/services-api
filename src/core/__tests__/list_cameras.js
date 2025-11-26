import { jest } from '@jest/globals'

const testUserId = 'testUserId'
const testCalipsaSiteId = 'testCalipsaSiteId'
const testTokenId = 'testTokenId'
const testTokenIds = [testTokenId]
const testViewId = 'testViewId'
const testView = {
  id: testViewId,
  createdAt: 'created',
  updatedAt: 'updated',
  calipsaViewId: 'testViewId',
  integratorId: 'testIntegratorId',
  name: 'testDisplayName',
  masks: [],
  snapshotSet: false,
  thermal: null,
  viewStatus: {
    active: true,
    isObjectDetection: false,
  },
  tampering: true,
  tamperingConfig: {
    day: {
      referenceImage: null,
      referenceImageUpdatedAt: null,
      isUpdatingReferenceImage: false,
    },
    night: {
      referenceImage: null,
      referenceImageUpdatedAt: null,
      isUpdatingReferenceImage: false,
    },
  },
}
const mockViewsWithoutTokenId = [testView]
const mockViewsWithTokenId = [{
  ...testView,
  tokenId: testTokenId,
}]

const mockDbQuery = jest.fn(() => mockViewsWithTokenId)

jest.unstable_mockModule('../../db', () => ({
  initDB: jest.fn(),
}))

const { initDB } = await import('../../db/index.js')

const {
  listCameras,
  listSharedCameras,
  listCamerasByTokenIds,
  listSharedCamerasByTokenIds,
} = await import('../list_cameras.js')

describe('Get cameras', () => {
  let mockSql
  beforeEach(() => {
    mockSql = {
      query: mockDbQuery,
    }
    initDB.mockResolvedValue(mockSql)
    mockSql.query.mockResolvedValue(mockViewsWithoutTokenId)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('Should call the DB function to get views and analytics', async () => {
    await listCameras(testUserId, testCalipsaSiteId)
    expect(mockSql.query).toHaveBeenCalledTimes(2)
  })

  it('Should provide the correct parameters to the DB function', async () => {
    await listCameras(testUserId, testCalipsaSiteId)
    const obj = mockSql.query.mock.calls[0][1]

    expect(obj.replacements.userId).toBe(testUserId)
    expect(obj.replacements.calipsaSiteId).toBe(testCalipsaSiteId)
  })

  it('Should fetch the views', async () => {
    const views = await listCameras(testUserId, testCalipsaSiteId)
    expect(views).toHaveLength(mockViewsWithoutTokenId.length)
    expect(views[0].id).toBe(testViewId)
    expect(views[0].tokenId).toBe(undefined)
  })
})

describe('Get shared cameras', () => {
  let mockSql
  beforeEach(() => {
    mockSql = {
      query: mockDbQuery,
    }
    initDB.mockResolvedValue(mockSql)
    mockSql.query.mockResolvedValue(mockViewsWithoutTokenId)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('Should call the DB function to get views and analytics', async () => {
    await listSharedCameras(testUserId, testCalipsaSiteId)
    expect(mockSql.query).toHaveBeenCalledTimes(2)
  })

  it('Should provide the correct parameters to the DB function', async () => {
    await listSharedCameras(testUserId, testCalipsaSiteId)
    const {
      replacements: { userId, calipsaSiteId },
    } = mockSql.query.mock.calls[0][1]

    expect(userId).toBe(testUserId)
    expect(calipsaSiteId).toBe(testCalipsaSiteId)
  })

  it('Should fetch the views', async () => {
    const views = await listSharedCameras(testUserId, testCalipsaSiteId)
    expect(views).toHaveLength(mockViewsWithoutTokenId.length)
    expect(views[0].id).toBe(testViewId)
    expect(views[0].tokenId).toBe(undefined)
  })
})

describe('Get cameras by tokenId', () => {
  let mockSql
  beforeEach(() => {
    mockSql = {
      query: mockDbQuery,
    }
    initDB.mockResolvedValue(mockSql)
    mockSql.query.mockResolvedValue(mockViewsWithTokenId)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('Should call the DB function to get views', async () => {
    await listCamerasByTokenIds(testUserId, testTokenIds)
    expect(mockSql.query).toHaveBeenCalledTimes(1)
  })

  it('Should provide the correct parameters to the DB function', async () => {
    await listCamerasByTokenIds(testUserId, testTokenIds)
    const {
      replacements: { userId, tokenIds },
    } = mockSql.query.mock.lastCall[1]

    expect(userId).toBe(testUserId)
    expect(tokenIds).toBeInstanceOf(Array)
    expect(tokenIds).toHaveLength(testTokenIds.length)
  })

  it('Should fetch the views', async () => {
    const views = await listCamerasByTokenIds(testUserId, testTokenIds)
    expect(views).toHaveLength(mockViewsWithTokenId.length)
    expect(views[0].id).toBe(testViewId)
    expect(views[0].tokenId).toBe(testTokenId)
  })
})

describe('Get shared cameras by tokenId', () => {
  let mockSql
  beforeEach(() => {
    mockSql = {
      query: mockDbQuery,
    }
    initDB.mockResolvedValue(mockSql)
    mockSql.query.mockResolvedValue(mockViewsWithTokenId)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('Should call the DB function to get views', async () => {
    await listSharedCamerasByTokenIds(testUserId, testTokenIds)
    expect(mockSql.query).toHaveBeenCalledTimes(1)
  })

  it('Should provide the correct parameters to the DB function', async () => {
    await listSharedCamerasByTokenIds(testUserId, testTokenIds)
    const {
      replacements: { userId, tokenIds },
    } = mockSql.query.mock.lastCall[1]

    expect(userId).toBe(testUserId)
    expect(tokenIds).toBeInstanceOf(Array)
    expect(tokenIds).toHaveLength(testTokenIds.length)
  })

  it('Should fetch the views', async () => {
    const views = await listSharedCamerasByTokenIds(testUserId, testTokenIds)
    expect(views).toHaveLength(mockViewsWithTokenId.length)
    expect(views[0].id).toBe(testViewId)
    expect(views[0].tokenId).toBe(testTokenId)
  })
})
