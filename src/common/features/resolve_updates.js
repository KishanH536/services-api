// Disable eqeqeq since we want to check if detection params are loosely equal in some cases.
/* eslint eqeqeq: 0 */

import { isEqual } from 'lodash-es'

const isLooselyEqual = (object1, object2) => {
  // Treat as equal if they are both falsey
  if (!object1 && !object2) {
    return true
  }
  return isEqual(object1, object2)
}

const isRuleEqual = (rule1, rule2) =>
// Strict equal for required fields
  rule1.integratorId === rule2.integratorId
    && rule1.name === rule2.name
    && rule1.active === rule2.active
    && rule1.objectType === rule2.objectType
    && rule1.detectionType === rule2.detectionType

    // Loose equality for optional detection parameters since they
    // will be 'null' from the DB and 'undefined' from transformed features
    && rule1.detectionPeriod == rule2.detectionPeriod
    && rule1.detectionMin == rule2.detectionMin
    && rule1.detectionMax == rule2.detectionMax

    // Compare object types using custom equality functions or _.isEqual
    && isEqual(rule1.zones, rule2.zones)
    && isLooselyEqual(rule1.meta, rule2.meta)
    && isLooselyEqual(rule1.categories, rule2.categories)

const resolveUpdates = (oldRules, newRules) => {
  const toDelete = []
  const toAdd = []

  // Find rules to delete
  for (const oldRule of oldRules) {
    if (!newRules.some(newRule => newRule.integratorId === oldRule.integratorId)) {
      toDelete.push(oldRule.id)
    }
  }

  // Find rules to add or replace
  for (const newRule of newRules) {
    const existingRule = oldRules.find(oldRule => oldRule.integratorId === newRule.integratorId)

    // If there is no old rule, add the new one.
    if (!existingRule) {
      toAdd.push(newRule)
    }
    else if (!isRuleEqual(existingRule, newRule)) {
      // Else if the rules are not equal, replace the old rule with the new rule
      toDelete.push(existingRule.id)
      toAdd.push(newRule)
    }
  }

  return {
    toDelete,
    toAdd,
  }
}

export default resolveUpdates
