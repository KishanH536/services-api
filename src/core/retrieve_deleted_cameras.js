import { QueryTypes } from 'sequelize'

import { initDB } from '../db/index.js'

const FIND_DELETED_CAMERAS_CALIPSA = `
  SELECT v.id "id"
    FROM public.views v
   WHERE v.id = :id
     AND v.deleted_at IS NOT null
`

const FIND_DELETED_CAMERAS_MOTOROLA = `
  SELECT v.id "id"
    FROM public.views v
   WHERE v.integrator_id = :id
     AND v.deleted_at IS NOT null
`

// TODO - this potentially exposes IDs for deleted cameras from ANY company.
export default async (integratorId, calipsaViewId) => {
  const sql = await initDB()

  const queryString = integratorId ? FIND_DELETED_CAMERAS_MOTOROLA : FIND_DELETED_CAMERAS_CALIPSA
  const id = integratorId || calipsaViewId

  const rows = await sql.query(queryString, {
    replacements: {
      id,
    },
    type: QueryTypes.SELECT,
    logging: false,
  })

  return rows?.length > 0 ? rows : null
}
