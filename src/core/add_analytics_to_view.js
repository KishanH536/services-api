import { QueryTypes } from 'sequelize'

import { analyticsIdsToFeatures } from '../constants/index.js'

export default async function getAnalytics(
  sql,
  view,
  transaction = null,
  useWriter = false,
) {
  const viewId = view.id || view.viewId || view.calipsaViewId
  const analytics = await sql.query(
    `
      SELECT a.capability_id "capabilityId",
                  a.config 
           FROM public.analytics a
           WHERE a.view_id = :viewId
    `,
    {
      replacements: { viewId },
      type: QueryTypes.SELECT,
      logging: false,
      transaction,
      useMaster: useWriter,
    },
  )

  if (analytics) {
    const analyticsFeatures = analytics.reduce((acc, analytic) => {
      const featureName = analyticsIdsToFeatures.get(analytic.capabilityId)
      acc[featureName] = analytic.config
      return acc
    }, {})

    view.analytics = analyticsFeatures
  }
  else {
    view.analytics = {}
  }

  return view
}
