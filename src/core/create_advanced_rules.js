import { initDB } from '../db/index.js'

const createAdvancedRules = async (userId, viewId, rules, transaction) => {
  const sql = await initDB()

  const creationPromises = rules.map(async rule => {
    const row = await sql.models.advancedRules.create(
      {
        ...rule,
        viewId,
        createdBy: userId,
        updatedBy: userId,

      },
      {
        transaction,
      },
    )

    let createdCategories

    if (rule.categories?.length) {
      createdCategories = await sql.models.categories.bulkCreate(
        rule.categories.map(category => ({
          ruleId: row.id,
          category,
        })),
        {
          transaction,
        },
      )
    }

    return {
      ...row.toJSON(),
      categories: createdCategories?.map(c => c.category), // don't need the rule ID anymore.
    }
  })

  const createdRules = await Promise.all(creationPromises)

  return createdRules?.map(rule => ({
    id: rule.id,
    integratorId: rule.integratorId,
    name: rule.name,
    active: rule.active,
    objectType: rule.objectType,
    detectionType: rule.detectionType,
    zones: rule.zones,
    viewId: rule.viewId,
    categories: rule.categories,
    detectionPeriod: rule.detectionPeriod,
    detectionMin: rule.detectionMin,
    detectionMax: rule.detectionMax,
    meta: rule.meta,
  }))
}

export default createAdvancedRules
