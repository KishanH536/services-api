import {
  RedshiftDataClient,
  ExecuteStatementCommand,
} from '@aws-sdk/client-redshift-data'

import {
  REDSHIFT_WORKGROUP as workgroup,
  REDSHIFT_DATABASE as database,
  REDSHIFT_ANNOTATIONS_TABLE as annotationsTable,
} from '../../config/aws.js'

import {
  compose,
  map,
} from '../utils/generic.js'

// client-redshift-data expects params in the form of an
// array of objects with `name` and `value` keys.
const mapParams = map(([name, value]) => ({
  name,
  value,
}))

const toStatementParams = compose(
  mapParams,
  Object.entries,
)

export const startRedshift = async (_services, log) => {
  const client = new RedshiftDataClient({})

  const insertAnnotation = async (analysisId, description) => {
    if (!annotationsTable) {
      log.warn('Annotations table name is not defined, skipping insert annotation')
      return
    }

    const statement = `INSERT INTO ${annotationsTable} values(:analysisId, :description)`

    const input = {
      Sql: statement,
      WorkgroupName: workgroup,
      Database: database,
      Parameters: toStatementParams({
        analysisId,
        description,
      }),
    }

    log.info({
      analysisId,
      description,
    }, 'Inserting annotation into Redshift')

    const command = new ExecuteStatementCommand(input)
    const response = await client.send(command)

    if (response.$metadata.httpStatusCode !== 200) {
      log.error({
        response,
      }, 'Error inserting annotation into Redshift')
      throw new Error('Error inserting annotation into Redshift')
    }

    log.info({
      response,
    }, 'Redshift insert annotation response')
  }

  return {
    service: {
      insertAnnotation,
    },
    stop: async () => {
      client.destroy()
    },
  }
}
