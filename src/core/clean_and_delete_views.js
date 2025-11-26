import { deleteTamperingRefs } from '../common/s3.js'

import deleteAdvancedRules from './delete_advanced_rules.js'

export async function deleteAnalytics(sql, t, viewIds) {
  // Delete analytics associated with this view
  const analytics = await sql.models.analytics.findAll({
    where: {
      viewId: viewIds,
    },
    transaction: t,
  })

  const ids = analytics.map((analytic) => analytic.id)
  if (!ids || !ids.length) {
    return
  }

  await sql.models.analytics.destroy({
    where: {
      id: ids,
    },
    transaction: t,
  })
}

export async function cleanAndDeleteViews(sql, t, views) {
  if (!views || !views.length) {
    return [0, []]
  }

  const viewIds = views.map((view) => view.id)

  const dayImages = views
    .map((view) => view.tamperingConfig?.day?.referenceImage)
    .filter(Boolean)

  const nightImages = views
    .map((view) => view.tamperingConfig?.night?.referenceImage)
    .filter(Boolean)

  const imageIds = dayImages.concat(nightImages)

  // Delete the views transactionally
  const [affectedCount, affectedRows] = await sql.models.view.update(
    {
      deletedAt: sql.literal('CURRENT_TIMESTAMP'),
    },
    {
      where: {
        id: viewIds, // Sequelize infers as "where: { id: { [Op.in]: viewIds } }"
      },
      transaction: t,
      returning: true,
    },
  )

  await deleteAnalytics(sql, t, viewIds)

  // Delete the view's advanced rules.
  // Don't use the getAdvancedRulesByViewIds function,
  // since it joins with the categories table, which is unecessary.
  const rules = await sql.models.advancedRules.findAll({
    where: {
      viewId: viewIds,
    },
    transaction: t,
  })
  await deleteAdvancedRules(rules.map((rule) => rule.id), t)

  t.afterCommit(async () => {
    // Delete images
    await deleteTamperingRefs(imageIds)
  })

  return [affectedCount, affectedRows]
}
