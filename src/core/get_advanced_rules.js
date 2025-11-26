import { QueryTypes } from 'sequelize'

import { initDB } from '../db/index.js'

const ADVANCED_RULES_BY_VIEW_ID_QUERY = `
  SELECT r.id AS "id",
         r.view_id "viewId",
         r.name "name",
         r.active "active",
         r.object_type "objectType",
         r.detection_type "detectionType",
         r.detection_period "detectionPeriod",
         r.detection_min "detectionMin",
         r.detection_max "detectionMax",
         r.detection_similarity_threshold "detectionSimilarityThreshold",
         r.zones "zones",
         r.meta "meta",
         r.created_by "createdBy",
         r.created_at "createdAt",
         r.updated_by "updatedBy",
         r.updated_at "updatedAt",
         r.integrator_id "integratorId",
         array_agg(c.category) FILTER (WHERE c.category IS NOT NULL) "categories"
  FROM advanced_rules.rules r
  LEFT JOIN advanced_rules.categories c
    ON c.rule_id = r.id
  WHERE r.view_id = :viewId
  GROUP BY r.id
`

// Same query as above, but matches multiple viewIds
const ADVANCED_RULES_BY_VIEW_IDS_QUERY = `
  SELECT r.id AS "id",
         r.view_id "viewId",
         r.name "name",
         r.active "active",
         r.object_type "objectType",
         r.detection_type "detectionType",
         r.detection_period "detectionPeriod",
         r.detection_min "detectionMin",
         r.detection_max "detectionMax",
         r.detection_similarity_threshold "detectionSimilarityThreshold",
         r.zones "zones",
         r.meta "meta",
         r.created_by "createdBy",
         r.created_at "createdAt",
         r.updated_by "updatedBy",
         r.updated_at "updatedAt",
         r.integrator_id "integratorId",
         array_agg(c.category) FILTER (WHERE c.category IS NOT NULL) "categories"
  FROM advanced_rules.rules r
  LEFT JOIN advanced_rules.categories c
    ON c.rule_id = r.id
  WHERE r.view_id = ANY(ARRAY[:viewIds]::uuid[])
  GROUP BY r.id
`

/**
 *
 * @param {*} viewId
 *
 * @returns {Promise<Array<{*}>>}
*/
export const getAdvancedRules = async (viewId, transaction = null) => {
  const sql = await initDB()

  return await sql.query(ADVANCED_RULES_BY_VIEW_ID_QUERY, {
    replacements: {
      viewId,
    },
    type: QueryTypes.SELECT,
    transaction,
  })
}

/**
 *
 * @param {Array<{*}>} viewIds
 *
 * @returns {Promise<Array<{*}>>}
*/
export const getAdvancedRulesByViewIds = async (viewIds, transaction = null) => {
  const sql = await initDB()

  return await sql.query(ADVANCED_RULES_BY_VIEW_IDS_QUERY, {
    replacements: {
      viewIds,
    },
    type: QueryTypes.SELECT,
    transaction,
  })
}
