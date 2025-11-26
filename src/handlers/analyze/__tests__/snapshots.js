import { jest } from '@jest/globals'

jest.unstable_mockModule('../../../core/create_or_update_camera', () => ({
  updateView: jest.fn(),
}))

jest.unstable_mockModule('../../../common/s3', () => ({
  uploadSnapshot: jest.fn(),
}))

const { updateView } = await import('../../../core/create_or_update_camera.js')
const { uploadSnapshot } = await import('../../../common/s3.js')
const { default: saveSnapshot } = await import('../snapshots.js')

const testCtx = {
  viewId: 'view-id',
  cameraData: {
    viewName: 'viewName',
    masks: [],
    thermal: false,
    siteId: 'site-id',
    viewStatus: {},
    tampering: false,
    analytics: {},
  },
  imageBuffers: [Buffer.from('')],
}

const testReq = {
  companyId: 'company-id',
  auth: {
    userId: 'user-id',
  },
  logger: {
    error: jest.fn(),
  },
}

describe('Save snapshots', () => {
  beforeEach(() => {
    updateView.mockClear()
    uploadSnapshot.mockClear()
  })

  it('updates the view to set snapshot to false', async () => {
    // Arrange
    const expectedSnapshotValue = false

    // Act
    await saveSnapshot(testCtx, testReq)

    // Assert
    // Props to update is the 4th argument (companyId, userId, viewId, propsToUpdate)
    expect(updateView.mock.lastCall[3].snapshot).toBe(expectedSnapshotValue)
  })

  it('uploads the snapshot to S3', async () => {
    // Act
    await saveSnapshot(testCtx, testReq)

    // Assert
    expect(uploadSnapshot).toHaveBeenCalled()
  })

  it('uses the 2nd image buffer if there are more than 1', async () => {
    // Arrange
    const testImageBuffers = [
      Buffer.from('first-image'),
      Buffer.from('second-image'),
    ]
    testCtx.imageBuffers = testImageBuffers

    // Act
    await saveSnapshot(testCtx, testReq)

    // Assert
    expect(uploadSnapshot.mock.lastCall[1]).toBe(testImageBuffers[1])
  })

  it('Does not throw an error if the upload fails', async () => {
    // Arrange
    uploadSnapshot.mockRejectedValue(new Error('Test Error'))

    // Act
    await saveSnapshot(testCtx, testReq)

    // Assert
    expect(testReq.logger.error).toHaveBeenCalled()
  })
})
