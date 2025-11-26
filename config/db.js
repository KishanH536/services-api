/*
 * This module contains information required to connect to the db
*/

const {
  DB_USER: username,
  DB_PASSWORD: password,
  DB_NAME: databaseName = 'cameras',
  DB_HOST: host = 'exeter.cntftp4pmwzm.eu-west-1.rds.amazonaws.com',
  DB_REPLICA_HOST: replicaHost = 'exeter.cntftp4pmwzm.eu-west-1.rds.amazonaws.com',
  DB_MAX_POOL_SIZE = 20,
  DB_USE_POSTGRES_OPTIONS,
} = process.env

const writer = {
  host,
  port: 5432,
  username,
  password,
}

const replica = {
  host: replicaHost,
  port: 5432,
  username,
  password,
}

const maxPoolSize = Number.parseInt(DB_MAX_POOL_SIZE, 10)

const usePostgresOptions = !(DB_USE_POSTGRES_OPTIONS === 'false' || DB_USE_POSTGRES_OPTIONS === false)

export {
  databaseName as database,
  writer,
  replica,
  maxPoolSize,
  // Needed to support disabling statement_timeout and other options when using RDS Proxy
  usePostgresOptions,
}
