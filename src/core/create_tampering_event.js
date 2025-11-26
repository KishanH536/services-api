import { initDB } from '../db/index.js'

export default async (eventData) => {
  const sql = await initDB()

  return sql.models.tampering.create({
    ...eventData,
  })
}
