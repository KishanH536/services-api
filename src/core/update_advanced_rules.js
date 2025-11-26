import resolveRuleUpdates from '../common/features/resolve_updates.js'

import deleteAdvancedRules from './delete_advanced_rules.js'
import createAdvancedRules from './create_advanced_rules.js'
import { getAdvancedRules } from './get_advanced_rules.js'

const updateAdvancedRules = async (userId, viewId, newRules, transaction) => {
  const originalAdvancedRules = await getAdvancedRules(viewId)

  const {
    toDelete,
    toAdd,
  } = resolveRuleUpdates(originalAdvancedRules, newRules)

  if (toDelete.length) {
    await deleteAdvancedRules(toDelete, transaction)
  }

  if (toAdd.length) {
    await createAdvancedRules(userId, viewId, toAdd, transaction)
  }
}

export default updateAdvancedRules
