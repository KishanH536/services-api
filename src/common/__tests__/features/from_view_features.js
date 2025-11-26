import { transformFromFeatures } from '../../view_features.js'

describe('Transform from Features', () => {
  it('Outputs a status object', () => {
    const output = transformFromFeatures()
    expect(output).toBeInstanceOf(Object)
  })

  it(
    'Returns inactive view features if there are no features',
    () => {
      const { status, tampering } = transformFromFeatures({})
      expect(status).toStrictEqual({ active: false })
      expect(tampering).toBe(false)
    },
  )

  it(
    'Returns the default features if the input is undefined',
    () => {
      const { status, tampering } = transformFromFeatures()
      expect(status).toStrictEqual({
        active: true,
        isObjectDetection: true,
        isHumanDetection: true,
        isVehicleDetection: true,
      })
      expect(tampering).toBe(false)
    },
  )

  it.each([[true, true], [true, false], [false, true]])(
    'Properly transforms object detection when enabled',
    (humanDetection, vehicleDetection) => {
      const features = {
        objectDetection: {
          humanDetection,
          vehicleDetection,
        },
      }

      const { status } = transformFromFeatures(features)
      expect(status).toStrictEqual({
        active: true,
        isObjectDetection: true,
        isHumanDetection: humanDetection,
        isVehicleDetection: vehicleDetection,
      })
    },
  )

  it('Transforms object detection as false if not present.', () => {
    const features = {
      forensic: {},
    }

    const { status } = transformFromFeatures(features)
    expect(status.isObjectDetection).toBe(false)
  })

  it.each([{}, undefined])(
    'Transforms the scene detection feature.',
    (sceneChangeDetection) => {
      const features = { sceneChangeDetection }

      const { tampering } = transformFromFeatures(features)
      expect(tampering).toBe(!!sceneChangeDetection)
    },
  )

  it.each([{}, undefined])(
    'Transforms the forensic feature.',
    (forensic) => {
      const features = { forensic }

      const { status } = transformFromFeatures(features)
      expect(status.isForensic).toBe(forensic ? true : undefined)
    },
  )

  it('Adds the advanced alarm property if there are advanced rules.', () => {
    const features = {
      advancedRules: [{ name: 'Test Rule' }],
    }

    const { status } = transformFromFeatures(features)
    expect(status.isAdvancedAlarm).toBe(true)
  })

  it('Transforms advanced alarms', () => {
    const name = 'Test Rule'
    const id = 'test-id'
    const zones = []
    const categories = ['person']

    const features = {
      advancedRules: [{
        integratorId: id,
        name,
        zones,
        categories,
        countDetection: {
          count: 5,
          active: true,
          numberOfObjectType: 'definite',
        },
      }],
    }

    const { status } = transformFromFeatures(features)
    const rule = status.advancedRules[0]

    expect(rule.active).toBe(true)
    expect(rule.name).toBe(name)
    expect(rule.id).toBe(id)
    expect(rule.zonesDetection).toEqual(zones)
    expect(rule.categoriesDetection).toEqual(categories)
    expect(rule.countDetection).toBeInstanceOf(Object)
  })

  it('Transforms the watch list detection rule.', () => {
    const alertId = 'test-alert-id'
    const ignoreId = 'test-ignore-id'

    const features = {
      advancedRules: [{
        integratorId: 'test-id',
        name: 'Test Rule',
        zones: [],
        categories: ['person'],
        watchListDetection: {
          alertList: [{
            id: alertId,
            type: 'watchlist-item',
            links: {
              'http://calipsa.io/relation/current-image': 'test-alert-url',
            },
          }],
          ignoreList: [{
            id: ignoreId,
            type: 'watchlist-item',
            links: {
              'http://calipsa.io/relation/current-image': 'test-ignore-url',
            },
          }],
        },
      }],
    }

    const { status } = transformFromFeatures(features)
    const watchListRule = status.advancedRules[0].watchListDetection

    expect(watchListRule.alertList).toHaveLength(1)
    expect(watchListRule.alertList[0]).toStrictEqual({ id: alertId })
    expect(watchListRule.ignoreList).toHaveLength(1)
    expect(watchListRule.ignoreList[0]).toStrictEqual({ id: ignoreId })
  })
})
