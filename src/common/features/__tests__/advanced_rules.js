import {
  API_SERVER_BASE_URL_FOR_LINKS as apiServerBaseUrl,
} from '../../../../config/api_server.js'

import {
  rowsToAdvancedRuleFeatures,
  advancedRuleFeaturesToRows,
} from '../advanced_rules.js'

const VIEW_ID = '456'
const RULE_ID = '789'
const basicRuleRowData = {
  integratorId: '123',
  viewId: VIEW_ID,
  id: RULE_ID,
  name: 'Test Detection',
  active: true,
  objectType: 'mixed',
  zones: [],
  categories: [],
}

const basicRuleFeatureData = {
  integratorId: '123',
  name: 'Test Rule',
}

describe('DB Rows to Advanced Rule Features', () => {
  it('Transforms the gun detection advanced rule', () => {
    const dbRow = {
      ...basicRuleRowData,
      detectionType: 'gun',
    }

    const [advancedRule] = rowsToAdvancedRuleFeatures([dbRow])

    expect(advancedRule).toHaveProperty('gunDetection')
    expect(advancedRule.gunDetection).toEqual({})
  })

  it('Transforms the face detection advanced rule', () => {
    const dbRow = {
      ...basicRuleRowData,
      detectionType: 'face',
    }

    const [advancedRule] = rowsToAdvancedRuleFeatures([dbRow])

    expect(advancedRule).toHaveProperty('faceDetection')
    expect(advancedRule.faceDetection).toEqual({})
  })

  it('Transforms the loitering detection advanced rule', () => {
    const dbRow = {
      ...basicRuleRowData,
      detectionType: 'loitering',
      objectType: 'person',
      categories: ['person'],
      detectionPeriod: 10,
    }

    const [advancedRule] = rowsToAdvancedRuleFeatures([dbRow])

    expect(advancedRule.objectType).toEqual('person')
    expect(advancedRule.categories).toEqual(['person'])
    expect(advancedRule).toHaveProperty('loiteringDetection')
    expect(advancedRule.loiteringDetection).toEqual({
      period: 10,
    })
  })

  it('Transforms the count detection advanced rule', () => {
    const dbRow = {
      ...basicRuleRowData,
      detectionType: 'count',
      objectType: 'person',
      categories: ['person'],
      detectionMin: 1,
      detectionMax: 5,
    }

    const [advancedRule] = rowsToAdvancedRuleFeatures([dbRow])

    expect(advancedRule.objectType).toEqual('person')
    expect(advancedRule.categories).toEqual(['person'])
    expect(advancedRule).toHaveProperty('countDetection')
    expect(advancedRule.countDetection).toEqual({
      numberMin: 1,
      numberMax: 5,
      numberOfObjectType: 'range',
    })
  })

  it('Transforms the watch list detection advanced rule', () => {
    const dbRow = {
      ...basicRuleRowData,
      detectionType: 'watch_list',
      objectType: 'person',
      categories: ['person'],
      meta: {
        alertList: [
          {
            id: '1',
          },
        ],
        ignoreList: [
          {
            id: '2',
          },
        ],
      },
    }

    const [advancedRule] = rowsToAdvancedRuleFeatures([dbRow])

    expect(advancedRule.objectType).toEqual('person')
    expect(advancedRule.categories).toEqual(['person'])
    expect(advancedRule).toHaveProperty('watchListDetection')
    expect(advancedRule.watchListDetection).toEqual({
      alertList: [
        {
          id: '1',
          type: 'watchlist-item',
          links: {
            'http://calipsa.io/relation/current-image': `${apiServerBaseUrl}/view/watchlist/image?path=${VIEW_ID}/${RULE_ID}/1.jpg`,
          },
        },
      ],
      ignoreList: [
        {
          id: '2',
          type: 'watchlist-item',
          links: {
            'http://calipsa.io/relation/current-image': `${apiServerBaseUrl}/view/watchlist/image?path=${VIEW_ID}/${RULE_ID}/2.jpg`,
          },
        },
      ],
    })
  })

  it('Transforms the crowd forming detection advanced rule', () => {
    const dbRow = {
      ...basicRuleRowData,
      detectionType: 'crowd_forming',
      objectType: 'person',
      categories: ['person'],
      detectionPeriod: 10,
      detectionMin: 1,
      detectionMax: 5,
    }

    const [advancedRule] = rowsToAdvancedRuleFeatures([dbRow])

    expect(advancedRule.objectType).toEqual('person')
    expect(advancedRule.categories).toEqual(['person'])
    expect(advancedRule).toHaveProperty('crowdFormingDetection')
    expect(advancedRule.crowdFormingDetection).toEqual({
      period: 10,
      numberMin: 1,
      numberMax: 5,
      numberOfObjectType: 'range',
    })
  })
})

describe('Advanced Rule features to DB Rows', () => {
  it('Transforms the gun detection advanced rule feature', () => {
    const advancedRule = {
      ...basicRuleFeatureData,
      gunDetection: {},
    }

    const [dbRow] = advancedRuleFeaturesToRows([advancedRule])

    expect(dbRow.detectionType).toEqual('gun')
  })

  it('Transforms the face detection advanced rule feature', () => {
    const advancedRule = {
      ...basicRuleFeatureData,
      faceDetection: {},
    }

    const [dbRow] = advancedRuleFeaturesToRows([advancedRule])

    expect(dbRow.detectionType).toEqual('face')
  })

  it('Transforms the loitering detection advanced rule feature', () => {
    const advancedRule = {
      ...basicRuleFeatureData,
      objectType: 'vehicle',
      categories: ['car', 'truck'],
      loiteringDetection: {
        period: 10,
      },
    }

    const [dbRow] = advancedRuleFeaturesToRows([advancedRule])

    expect(dbRow.detectionType).toEqual('loitering')
    expect(dbRow.objectType).toEqual('vehicle')
    expect(dbRow.categories).toEqual(['car', 'truck'])
    expect(dbRow.detectionPeriod).toEqual(10)
  })

  it('Transforms the count detection advanced rule feature', () => {
    const advancedRule = {
      ...basicRuleFeatureData,
      objectType: 'vehicle',
      categories: ['car', 'truck'],
      countDetection: {
        numberMin: 1,
        numberMax: 5,
        numberOfObjectType: 'range',
      },
    }

    const [dbRow] = advancedRuleFeaturesToRows([advancedRule])

    expect(dbRow.detectionType).toEqual('count')
    expect(dbRow.objectType).toEqual('vehicle')
    expect(dbRow.categories).toEqual(['car', 'truck'])
    expect(dbRow.detectionMin).toEqual(1)
    expect(dbRow.detectionMax).toEqual(5)
  })

  it('Transforms the watch list detection advanced rule feature', () => {
    const advancedRule = {
      ...basicRuleFeatureData,
      watchListDetection: {
        alertList: [
          {
            id: '1',
            type: 'watchlist-item',
            links: {
              'http://calipsa.io/relation/current-image': `${apiServerBaseUrl}/view/watchlist/image?path=${VIEW_ID}/${RULE_ID}/1.jpg`,
            },
          },
        ],
        ignoreList: [
          {
            id: '2',
            type: 'watchlist-item',
            links: {
              'http://calipsa.io/relation/current-image': `${apiServerBaseUrl}/view/watchlist/image?path=${VIEW_ID}/${RULE_ID}/2.jpg`,
            },
          },
        ],
      },
    }

    const [dbRow] = advancedRuleFeaturesToRows([advancedRule])

    expect(dbRow.detectionType).toEqual('watch_list')
    expect(dbRow.meta).toEqual({
      alertList: [
        {
          id: '1',
        },
      ],
      ignoreList: [
        {
          id: '2',
        },
      ],
    })
  })

  it('Transforms the crowd forming detection advanced rule feature', () => {
    const advancedRule = {
      ...basicRuleFeatureData,
      objectType: 'person',
      categories: ['person'],
      crowdFormingDetection: {
        period: 10,
        numberMin: 1,
        numberMax: 5,
        numberOfObjectType: 'range',
      },
    }

    const [dbRow] = advancedRuleFeaturesToRows([advancedRule])

    expect(dbRow.detectionType).toEqual('crowd_forming')
    expect(dbRow.objectType).toEqual('person')
    expect(dbRow.categories).toEqual(['person'])
    expect(dbRow.detectionPeriod).toEqual(10)
    expect(dbRow.detectionMin).toEqual(1)
    expect(dbRow.detectionMax).toEqual(5)
  })
})
