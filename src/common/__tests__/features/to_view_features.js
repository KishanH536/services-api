import { transformToFeatures } from '../../view_features.js'

describe('Transform to Features', () => {
  it('Outputs a features object', () => {
    const output = transformToFeatures({})
    expect(output).toBeInstanceOf(Object)
  })

  it("Doesn't include features if they don't exist in the view status", () => {
    const output = transformToFeatures({})

    expect(output).not.toHaveProperty('objectDetection')
    expect(output).not.toHaveProperty('sceneChangeDetection')
    expect(output).not.toHaveProperty('forensic')
    expect(output).not.toHaveProperty('advancedRules')
  })

  it('Properly transforms the tampering property', () => {
    const output = transformToFeatures({
      viewStatus: { active: true },
      tampering: true,
    })

    expect(output.sceneChangeDetection).toBeInstanceOf(Object)
  })

  it('Properly transforms the tamperingConfig property for null reference images', () => {
    const output = transformToFeatures({
      viewStatus: { active: true },
      tampering: true,
      tamperingConfig: {
        day: {
          referenceImage: null,
          referenceImageUpdatedAt: '2023-05-31T20:35:32.574Z',
          isUpdatingReferenceImage: false,
        },
        night: {
          referenceImage: null,
          referenceImageUpdatedAt: '2023-05-31T20:35:32.574Z',
          isUpdatingReferenceImage: false,
        },
      },
    })

    expect(JSON.stringify(output.sceneChangeDetection)).toBe('{}')
  })

  it('Properly transforms the tamperingConfig property for present reference images', () => {
    const testViewId = 'test-view-id'
    const testDateTime = '2023-05-31T20:35:32.574Z'

    const output = transformToFeatures({
      viewId: testViewId,
      viewStatus: { active: true },
      tampering: true,
      tamperingConfig: {
        day: {
          referenceImage: 'day-image-uuid',
          referenceImageUpdatedAt: testDateTime,
          isUpdatingReferenceImage: false,
        },
        night: {
          referenceImage: 'night-image-uuid',
          referenceImageUpdatedAt: testDateTime,
          isUpdatingReferenceImage: false,
        },
      },
    })

    const expectedPath = `/views/${testViewId}/snapshot?refImage=`

    expect(output.sceneChangeDetection).toHaveProperty('dayReferenceImage')
    expect(output.sceneChangeDetection.dayReferenceImage).toHaveProperty('links')
    expect(Object.keys(output.sceneChangeDetection.dayReferenceImage.links)[0]).toBe('http://calipsa.io/relation/current-image')
    expect(output.sceneChangeDetection.dayReferenceImage.links['http://calipsa.io/relation/current-image']).toHaveProperty('href')
    expect(output.sceneChangeDetection.dayReferenceImage.links['http://calipsa.io/relation/current-image'].href).toBe(`${expectedPath}day`)
    expect(output.sceneChangeDetection.dayReferenceImage.links['http://calipsa.io/relation/current-image']).toHaveProperty('meta')
    expect(output.sceneChangeDetection.dayReferenceImage.links['http://calipsa.io/relation/current-image'].meta).toHaveProperty('lastUpdatedAt')
    expect(output.sceneChangeDetection.dayReferenceImage.links['http://calipsa.io/relation/current-image'].meta.lastUpdatedAt).toBe(testDateTime)

    expect(output.sceneChangeDetection).toHaveProperty('nightReferenceImage')
    expect(output.sceneChangeDetection.nightReferenceImage).toHaveProperty('links')
    expect(Object.keys(output.sceneChangeDetection.nightReferenceImage.links)[0]).toBe('http://calipsa.io/relation/current-image')
    expect(output.sceneChangeDetection.nightReferenceImage.links['http://calipsa.io/relation/current-image']).toHaveProperty('href')
    expect(output.sceneChangeDetection.nightReferenceImage.links['http://calipsa.io/relation/current-image'].href).toBe(`${expectedPath}night`)
    expect(output.sceneChangeDetection.nightReferenceImage.links['http://calipsa.io/relation/current-image']).toHaveProperty('meta')
    expect(output.sceneChangeDetection.nightReferenceImage.links['http://calipsa.io/relation/current-image'].meta).toHaveProperty('lastUpdatedAt')
    expect(output.sceneChangeDetection.nightReferenceImage.links['http://calipsa.io/relation/current-image'].meta.lastUpdatedAt).toBe(testDateTime)
  })

  it.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])('Properly transforms the object detection feature', (human, vehicle) => {
    const output = transformToFeatures({
      viewStatus: {
        active: true,
        isObjectDetection: true,
        isHumanDetection: human,
        isVehicleDetection: vehicle,
      },
    })

    expect(output.objectDetection).toBeInstanceOf(Object)
    expect(output.objectDetection.humanDetection).toBe(human)
    expect(output.objectDetection.vehicleDetection).toBe(vehicle)
  })

  it('Properly transforms the forensic feature', () => {
    const output = transformToFeatures({
      viewStatus: {
        active: true,
        isForensic: true,
      },
    })

    expect(output.forensic).toBeInstanceOf(Object)
  })

  it('Ignores advanced rules if the advanced alarm feature is disabled.', () => {
    const output = transformToFeatures({
      viewStatus: {
        active: true,
        isAdvancedAlarm: false,
        advancedRules: [
          {
            active: true,
            objectType: 'person',
          },
        ],
      },
    })

    expect(output).not.toHaveProperty('advancedRules')
  })

  it('Ignores advanced rules if there are no active rules.', () => {
    const output = transformToFeatures({
      viewStatus: {
        active: true,
        isAdvancedAlarm: true,
        advancedRules: [
          {
            active: false,
            objectType: 'person',
          },
        ],
      },
    })

    expect(output).not.toHaveProperty('advancedRules')
  })

  it('Transforms active advanced rules', () => {
    const output = transformToFeatures({
      viewStatus: {
        active: true,
        isAdvancedAlarm: true,
        advancedRules: [{
          active: true,
          id: 'test-id',
          name: 'test rule name',
          zonesDetection: [[[0, 0], [0.2, 0.3], [1, 1]]],
          objectType: 'person',
          categoriesDetection: ['person'],
          countDetection: {
            count: 5,
            active: true,
          },
        }],
      },
    })

    expect(output.advancedRules).toHaveLength(1)
    expect(output.advancedRules[0]).toHaveProperty('countDetection')
  })

  it('Transforms watch list detections into watchlist resources', () => {
    const output = transformToFeatures({
      viewStatus: {
        active: true,
        isAdvancedAlarm: true,
        advancedRules: [{
          active: true,
          id: 'test-id',
          name: 'test rule name',
          watchListDetection: {
            active: true,
            alertList: [
              { id: '123' },
            ],
            ignoreList: [
              { id: '456' },
            ],
          },
        }],
      },
    })

    let watchItem = output.advancedRules[0].watchListDetection.alertList[0]
    expect(watchItem).toHaveProperty('id', '123')
    expect(watchItem).toHaveProperty('type', 'watchlist-item')
    expect(watchItem.links).toHaveProperty(['http://calipsa.io/relation/current-image'])
    watchItem = output.advancedRules[0].watchListDetection.ignoreList[0]
    expect(watchItem).toHaveProperty('id', '456')
    expect(watchItem).toHaveProperty('type', 'watchlist-item')
    expect(watchItem.links).toHaveProperty(['http://calipsa.io/relation/current-image'])
  })

  it("Doesn't transform empty alert lists into watchlist resources", () => {
    const output = transformToFeatures({
      viewStatus: {
        active: true,
        isAdvancedAlarm: true,
        advancedRules: [{
          active: true,
          id: 'test-id',
          name: 'test rule name',
          watchListDetection: {
            active: true,
            alertList: [
            ],
          },
        }],
      },
    })

    const detection = output.advancedRules[0].watchListDetection
    expect(detection.alertList).toHaveLength(0)
    expect(detection.ignoreList).not.toBeDefined()
  })

  it('Does not include the active property for active advanced rules and active advanced detections', () => {
    const output = transformToFeatures({
      viewStatus: {
        active: true,
        isAdvancedAlarm: true,
        advancedRules: [{
          active: true,
          id: 'test-id',
          name: 'test rule name',
          countDetection: {
            active: true,
            count: 5,
          },
        }],
      },
    })

    expect(output.advancedRules).not.toHaveProperty('active')
    expect(output.advancedRules[0].countDetection).not.toHaveProperty('active')
  })

  it.each([
    [undefined, undefined, undefined],
    [true, undefined, undefined],
    [true, true, undefined],
    [true, undefined, true],
  ])(
    'Sets default object detection configuration when values are not present.',
    (isObjectDetection, isHumanDetection, isVehicleDetection) => {
      const output = transformToFeatures({
        viewStatus: {
          active: true,
          isObjectDetection,
          isHumanDetection,
          isVehicleDetection,
        },
      })

      expect(output.objectDetection).toBeInstanceOf(Object)
      expect(output.objectDetection.humanDetection).toBe(true)
      expect(output.objectDetection.vehicleDetection).toBe(true)
    },
  )

  it('Does not include the object detection feature when it is explicitly false.', () => {
    const output = transformToFeatures({
      viewStatus: {
        active: true,
        isObjectDetection: false,
      },
    })

    expect(output).not.toHaveProperty('objectDetection')
  })

  it.each([
    [false, true],
    [true, false],
    [false, false],
    [true, true],
    [undefined, true],
    [true, undefined],
    [undefined, undefined],
  ])(
    'Treats human and vehicle detection values as true, unless explicitly false.',
    (isHumanDetection, isVehicleDetection) => {
      const { objectDetection } = transformToFeatures({
        viewStatus: {
          active: true,
          isObjectDetection: true,
          isHumanDetection,
          isVehicleDetection,
        },
      })

      expect(objectDetection.humanDetection).toBe(isHumanDetection !== false)
      expect(objectDetection.vehicleDetection).toBe(isVehicleDetection !== false)
    },
  )

  it('Returns an empty features object if the camera is not active.', () => {
    const output = transformToFeatures({
      viewStatus: {
        active: false,
      },
    })

    expect(output).toBeInstanceOf(Object)
    expect(Object.keys(output)).toHaveLength(0)
  })
})
