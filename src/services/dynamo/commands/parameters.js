export class ParameterHelper {
  constructor(
    tableName,
    keyNames,
    queryLimit,
  ) {
    this.tableName = tableName
    this.keyNames = keyNames
    this.queryLimit = queryLimit
  }

  getKeys(pKeyValue, sKeyValue) {
    const keys = {
      [this.keyNames.primary]: pKeyValue,
    }

    if (sKeyValue !== undefined) {
      keys[this.keyNames.sort] = sKeyValue
    }

    return keys
  }

  getParameters(pKey, sKey) {
    return {
      TableName: this.tableName,
      Key: this.getKeys(pKey, sKey),
    }
  }

  putParameters(pKey, sKey, data) {
    return {
      TableName: this.tableName,
      Item: {
        ...this.getKeys(pKey, sKey),
        ...data,
      },
    }
  }

  queryParameters(keyCondition, filter) {
    const keyConditionExpression = keyCondition.getExpression()
    const expressionValues = {
      ...keyCondition.expressionValues,
      // Default is {} so this is ok even if the filter is empty
      ...filter.expressionValues,
    }

    const params = {
      TableName: this.tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionValues,
      Limit: this.queryLimit,
    }

    if (filter.conditions.length > 0) {
      params.FilterExpression = filter.getExpression()
    }

    return params
  }
}
