import { initDB } from '../db/index.js'

const deleteAdvancedRulesTransaction = async (ruleIds, transaction) => {
  const sql = await initDB()

  // Delete categories first to avoid FK constraint violation.
  await sql.models.categories.destroy({
    where: {
      ruleId: ruleIds,
    },
    transaction,
  })

  await sql.models.advancedRules.destroy({
    where: {
      id: ruleIds,
    },
    transaction,
  })
}

const deleteAdvancedRules = async (ruleIds, transaction) => {
  if (!ruleIds || !ruleIds.length) {
    return
  }

  const sql = await initDB()

  if (transaction) {
    return deleteAdvancedRulesTransaction(ruleIds, transaction)
  }

  return await sql.transaction(async t => deleteAdvancedRulesTransaction(ruleIds, t))
}

export default deleteAdvancedRules
