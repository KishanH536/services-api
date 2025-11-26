import { QueryTypes } from 'sequelize'

import { initDB } from '../db/index.js'

const FIND_ALARM_QUERY = `
  SELECT a.images_modified AS "alarmUuid" 
  FROM public.alarms a
    INNER JOIN public.views v
      ON a.view_id = v.id
    INNER JOIN public.sites_all sa
      ON sa.id = v.site_id
    INNER JOIN public.projects p
      ON sa.project_id = p.id
    INNER JOIN public.companies c
      ON p.company_id = c.id
    INNER JOIN public.users u
     ON u.company_id = c.id
  WHERE a.id = :alarmId
    AND u.id = :userId
    AND c.deleted_at IS NULL
    AND p.deleted_at IS NULL
    AND u.deleted_at IS NULL
    AND sa.deleted_at IS NULL
  LIMIT 1
`

/**
 *
 * @param {*} userId
 * @param {*} alarmId
 */
export default async (userId, alarmId) => {
  const sql = await initDB()

  const rows = await sql.query(FIND_ALARM_QUERY, {
    replacements: {
      userId,
      alarmId,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })

  if (rows && rows.length > 0) {
    return rows[0].alarmUuid
  }

  return null
}
