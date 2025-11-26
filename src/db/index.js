import Sequelize from 'sequelize'

import {
  database,
  writer as writerConfig,
  replica as replicaConfig,
  maxPoolSize,
  usePostgresOptions,
} from '../../config/db.js'

import {
  dbErrorCounter,
} from '../common/prometheus.js'

/* eslint-disable-next-line import/no-mutable-exports */
export let sql = null

export async function initDB(log) {
  if (sql) {
    return sql
  }

  const dbLog = log.child({ module: 'db' })

  const config = {
    dialect: 'postgres',
    replication: {
      read: [{
        ...replicaConfig,
      }],
      write: {
        ...writerConfig,
      },
    },
    pool: {
      max: maxPoolSize,
      min: 1,
      // The time interval, in milliseconds,
      // after which sequelize-pool will remove idle connections.
      evict: 1000,
      // The maximum time, in milliseconds,
      // that a connection can be idle before being released.
      idle: 10000,
      // The maximum time, in milliseconds,
      // that pool will try to get connection before throwing error
      acquire: 60000,
    },
    logging: (msg) => dbLog.debug(msg),
  }

  if (usePostgresOptions) {
    config.dialectOptions = {
      idle_in_transaction_session_timeout: 5000,
      statement_timeout: 10000,
    }
  }

  sql = new Sequelize(database, null, null, config)

  // Override the query method to increment the DB error counter.
  sql.query = async function (...args) {
    try {
      return await Sequelize.prototype.query.apply(this, args)
    }
    catch (err) {
      dbErrorCounter.inc()
      throw err
    }
  }

  const { default: requireModels } = await import('./schema.js')
  requireModels(sql)

  await sql.authenticate()
  await sql.authenticate({ useMaster: true })

  return sql
}
