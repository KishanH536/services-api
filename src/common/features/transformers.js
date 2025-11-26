import { toWatchListItemResource } from './watchlist.js'

const getCommonRuleProps = (rule) => ({
  integratorId: rule.integratorId,
  name: rule.name,
  ...rule.zones?.length ? rule.zones : {},
})

export const toResourceTransformers = {
  countDetection: (rule) => ({
    ...getCommonRuleProps(rule),
    objectType: rule.objectType,
    categories: rule.categories,
    countDetection: {
      numberMin: rule.detectionMin,
      numberMax: rule.detectionMax,
      numberOfObjectType: 'range',
    },
  }),
  crowdFormingDetection: (rule) => ({
    ...getCommonRuleProps(rule),
    objectType: rule.objectType,
    categories: rule.categories,
    crowdFormingDetection: {
      period: rule.detectionPeriod,
      numberMin: rule.detectionMin,
      numberMax: rule.detectionMax,
      numberOfObjectType: 'range',
    },
  }),
  gunDetection: (rule) => ({
    ...getCommonRuleProps(rule),
    gunDetection: {},
  }),
  faceDetection: (rule) => ({
    ...getCommonRuleProps(rule),
    faceDetection: {},
  }),
  loiteringDetection: (rule) => ({
    ...getCommonRuleProps(rule),
    objectType: rule.objectType,
    categories: rule.categories,
    loiteringDetection: {
      period: rule.detectionPeriod,
    },
  }),
  watchListDetection: (rule) => {
    const { alertList, ignoreList } = rule.meta || {}
    const toResource = (item) => toWatchListItemResource(rule.viewId, rule.id, item)

    return {
      ...getCommonRuleProps(rule),
      objectType: rule.objectType,
      categories: rule.categories,
      watchListDetection: {
        alertList: alertList?.map(toResource),
        ignoreList: ignoreList?.map(toResource),
      },
    }
  },
}

// Transform the rule's detection object into the min, max, period, etc. details
// for the advanced rule DB row.
export const toRowDetectionDetailsTransformers = {
  loiteringDetection: (ruleResource) => ({
    detectionPeriod: ruleResource.period,
  }),
  countDetection: (ruleResource) => ({
    detectionMin: ruleResource.numberMin || ruleResource.count,
    detectionMax: ruleResource.numberMax,
  }),
  crowdFormingDetection: (ruleResource) => ({
    detectionPeriod: ruleResource.period,
    detectionMin: ruleResource.numberMin || ruleResource.count,
    detectionMax: ruleResource.numberMax,
  }),
  gunDetection: () => ({}),
  faceDetection: () => ({}),
  watchListDetection: (ruleResource) => ({
    meta: {
      alertList: ruleResource.alertList.map(element => ({ id: element.id })),
      ignoreList: ruleResource.ignoreList.map(element => ({ id: element.id })),
    },
  }),
}
