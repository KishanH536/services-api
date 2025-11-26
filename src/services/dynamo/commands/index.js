import {
  PutCommand,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'

import { ParameterHelper } from './parameters.js'

export class CommandHelper {
  constructor(
    tableName,
    pKeyName,
    sKeyName,
    queryLimit,
  ) {
    this.tableName = tableName
    this.keyNames = {
      primary: pKeyName,
      sort: sKeyName,
    }

    this.parameterHelper = new ParameterHelper(
      this.tableName,
      this.keyNames,
      queryLimit,
    )
  }

  getCommand(pKey, sKey) {
    const params = this.parameterHelper.getParameters(
      pKey,
      sKey,
    )

    return new GetCommand(params)
  }

  putCommand(pKey, sKey, data) {
    const params = this.parameterHelper.putParameters(
      pKey,
      sKey,
      data,
    )

    return new PutCommand(params)
  }

  queryCommand(keyCondition, filter) {
    const params = this.parameterHelper.queryParameters(
      keyCondition,
      filter,
    )

    return new QueryCommand(params)
  }
}
