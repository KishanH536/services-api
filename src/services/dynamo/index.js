/*
A note on the DynamoDB query and result limits. The
`resultLimit` is the maximum number of results that will
be returned to the caller. The `queryLimit` is the maximum
number of results that will be requested from DynamoDB in a
single query. If the `resultLimit` is higher than the
`queryLimit`, then multiple queries will be made to DynamoDB
until either the `resultLimit` is reached, or there are no
more results to retrieve.

Generally, the `queryLimit` should be set to a much larger
value than the `resultLimit`, to minimize the number of
queries made to DynamoDB, and thus reduce latency. DynamoDB
already has a maximum of 1MB of data per query, so setting
the `queryLimit` to a very high value may not increase the
actual number of results returned per query.

DynamoDB queries are paginated, so if there are more results
than the `queryLimit`, then the response will include a
`LastEvaluatedKey` value, which can be used to continue the
query from where it left off. This is handled in the code
below.

There will be cases where multiple queries are required to
reach the `resultLimit`, even if the `queryLimit` is high,
because the results may be filtered out by the `viewId` and
`siteId` parameters. This is a function of how DynamoDB
queries work (i.e. filtering is done after the query, not
before), and cannot be changed.
*/

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb'

import {
  DYNAMODB_ANALYSIS_RESULTS_TABLE as analysisResultsTable,
  DYNAMODB_ANALYSIS_RESULTS_QUERY_LIMIT as queryLimit,
  DYNAMODB_ANALYSIS_RESULTS_RESULT_LIMIT as resultLimit,
} from '../../../config/aws.js'

import {
  split,
} from '../../utils/generic.js'

import {
  uuidFromTimestamp,
  timestampFromUuid,
  normalizeResult,
  normalizeResults,
} from './utils.js'

import {
  ExpressionBuilder,
} from './commands/expressions.js'

import {
  CommandHelper,
} from './commands/index.js'

const PRIMARY_KEY_NAME = 'companyId'
const SORT_KEY_NAME = 'analysisId'

export const startDynamo = async (_services, log) => {
  const marshallOptions = {
    removeUndefinedValues: true,
  }

  const client = new DynamoDBClient({})
  const ddbDocClient = DynamoDBDocumentClient.from(
    client,
    {
      marshallOptions,
    },
  )

  const commandHelper = new CommandHelper(
    analysisResultsTable,
    PRIMARY_KEY_NAME,
    SORT_KEY_NAME,
    queryLimit,
  )

  const putAnalysisResult = async ({
    companyId,
    analysisId,
    analysisResult,
    expireAt,
    viewId,
    siteId,
    viewConfig,
  }) => {
    if (!analysisResultsTable) {
      log.warn('Analysis results table name is not defined, skipping put analysis result')
      return
    }

    const putCommand = commandHelper.putCommand(
      companyId,
      analysisId,
      {
        analysisResult,
        createdAt: new Date().toISOString(),
        expireAt,
        viewId,
        siteId,
        viewConfig,
      },
    )

    try {
      const data = await ddbDocClient.send(putCommand)
      log.info({
        analysisId,
        data,
      }, 'Dynamo DB put analysis result response')
    }
    catch (err) {
      log.error({
        companyId,
        analysisId,
        err,
      }, 'Dynamo DB put analysis result error')
    }
  }

  const getAnalysisResults = async (
    companyId,
    // parameters:
    {
      startTime,
      endTime,
      viewId,
      siteId,
    },
  ) => {
    log.info({
      companyId,
      startTime,
      endTime,
      viewId,
      siteId,
    }, 'Getting all analysis results for company from DynamoDB')

    if (!analysisResultsTable) {
      log.warn('Analysis results table name is not defined, skipping get analysis results')
      return []
    }

    const endUuid = uuidFromTimestamp(endTime)

    const baseKeyCondition = new ExpressionBuilder()
      .addEqualCondition(PRIMARY_KEY_NAME, companyId)

    const filter = new ExpressionBuilder()
      .addEqualCondition('viewId', viewId)
      .addEqualCondition('siteId', siteId)

    const analyses = []
    let continueFrom = startTime
    let queryCount = 0 // Logging only

    try {
      while (continueFrom && analyses.length < resultLimit) {
        const keyCondition = ExpressionBuilder
          .from(baseKeyCondition)
          .addBetweenCondition(
            SORT_KEY_NAME,
            uuidFromTimestamp(continueFrom),
            endUuid,
          )

        const queryCommand = commandHelper.queryCommand(
          keyCondition,
          filter,
        )

        // This await and loop are required for repeated queries
        // eslint-disable-next-line no-await-in-loop
        const data = await ddbDocClient.send(queryCommand)

        const results = data.Items || []
        analyses.push(...normalizeResults(results))

        // Recalculate loop var
        // Offset by 1ms to avoid repeating last item
        continueFrom = data.LastEvaluatedKey
          && timestampFromUuid(
            data.LastEvaluatedKey.analysisId,
            1, // ms
          )

        log.info({
          companyId,
          startTime,
          endTime,
          viewId,
          siteId,
          itemCount: data.Items?.length || 0,
          currentResultLength: analyses.length,
          queryCount: queryCount++, // For logging only
          continueFrom,
        }, 'Successfully retrieved analysis results from DynamoDB')
      }

      // Trim to resultLimit if needed
      const [first, last] = split(analyses, resultLimit)
      const lastId = last[0]?.analysisId
      const lastTimestamp = lastId
        ? timestampFromUuid(lastId)
        : undefined

      // Only include next timestamp if we expect more results
      return {
        analyses: first,
        nextTimestamp: lastTimestamp || continueFrom,
      }
    }
    catch (err) {
      log.error({
        companyId,
        startTime,
        endTime,
        viewId,
        siteId,
        err,
      }, 'Error retrieving analysis results from DynamoDB')
      return []
    }
  }

  const getAnalysisResult = async (
    companyId,
    analysisId,
  ) => {
    log.info({
      companyId,
      analysisId,
    }, 'Getting analysis result from DynamoDB')

    const getCommand = commandHelper.getCommand(
      companyId,
      analysisId,
    )

    try {
      const data = await ddbDocClient.send(getCommand)

      if (!data?.Item) {
        log.info({
          companyId,
          analysisId,
        }, 'Analysis result not found in DynamoDB')
        return
      }

      log.info({
        companyId,
        analysisId,
      }, 'Successfully retrieved analysis result from DynamoDB')

      return normalizeResult(data.Item)
    }
    catch (err) {
      log.error({ err }, 'Dynamo DB get analysis result error')
    }
  }

  return {
    service: {
      putAnalysisResult,
      getAnalysisResult,
      getAnalysisResults,
    },
    stop: async () => {
      ddbDocClient.destroy()
      client.destroy()
    },
  }
}
