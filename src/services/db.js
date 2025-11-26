import { initDB } from '../db/index.js'

/**
 * Starts the database service.
 * @returns {Promise<{
*  service: Sequelize,
*  stop: () => Promise<void>
* }>}
*/
export const startDb = async (_services, log) => {
  const sql = await initDB(log)

  return {
    service: sql,
    stop: async () => await sql.close(),
  }
}
