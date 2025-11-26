import {
  setOnDemandSceneChange,
} from '../on_demand.js'

import {
  skip,
  viewIsNotEligible,
  noChecks,
} from '../payloads.js'

const testViewId = 'test-view-id'

describe('On Demand Scene Change Configuration', () => {
  it('Does not perform if the capability check has already determined it is not eligible.', () => {
    // Arrange
    const notEligibleResult = {
      withChecks: {
        notEligible: {
          companyId: 'company-id',
        },
      },
    }
    const ctx = {
      options: {
        sceneChange: {},
      },
      detections: {
        tampering: notEligibleResult,
      },
    }

    // Act
    setOnDemandSceneChange(ctx)

    // Assert
    expect(ctx.detections.tampering).toEqual(notEligibleResult)
  })

  it('Skips tampering detection if sceneChange.perform is false.', () => {
    // Arrange
    const ctx = {
      options: {
        sceneChange: {
          perform: false,
        },
      },
      detections: {},
    }

    // Act
    setOnDemandSceneChange(ctx)

    // Assert
    expect(ctx.detections.tampering).toMatchObject(skip())
  })

  it('Skips tampering detection if the view is does not have the feature', () => {
    // Arrange
    const ctx = {
      viewId: testViewId,
      options: {
        sceneChange: {
          perform: true,
        },
      },
      detections: {},
      features: {},
    }

    // Act
    setOnDemandSceneChange(ctx)

    // Assert
    expect(ctx.detections.tampering).toMatchObject(viewIsNotEligible(testViewId))
  })

  it('Sets tampering detection to no checks if all other checks pass', () => {
    // Arrange
    const ctx = {
      viewId: testViewId,
      options: {
        sceneChange: {
          perform: true,
          references: [{
            id: 'reference-id-1',
          }],
        },
      },
      detections: {},
      features: {
        sceneChangeDetection: true,
      },
    }

    // Act
    setOnDemandSceneChange(ctx)

    // Assert
    expect(ctx.detections.tampering).toMatchObject(noChecks([{ id: 'reference-id-1' }]))
  })
})
