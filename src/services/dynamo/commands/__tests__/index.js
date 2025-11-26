import { ExpressionBuilder } from '../expressions.js'
import { ParameterHelper } from '../parameters.js'

const testTable = 'test-table-name'
const primaryKeyName = 'testPrimaryKey'
const sortKeyName = 'testSortKey'

const queryLimit = 100

describe('ParameterHelper', () => {
  const parameterHelper = new ParameterHelper(
    testTable,
    {
      primary: primaryKeyName,
      sort: sortKeyName,
    },
    queryLimit,
  )

  it('Should create parameters for a get command', () => {
    const pKey = 'testPrimaryKeyValue'
    const sKey = 'testSortKeyValue'

    const params = parameterHelper.getParameters(pKey, sKey)

    expect(params).toEqual({
      TableName: testTable,
      Key: {
        [primaryKeyName]: pKey,
        [sortKeyName]: sKey,
      },
    })
  })

  it('Should create parameters for a put command', () => {
    const pKey = 'testPrimaryKeyValue'
    const sKey = 'testSortKeyValue'
    const data = { testData: 'value' }

    const params = parameterHelper.putParameters(pKey, sKey, data)

    expect(params).toEqual({
      TableName: testTable,
      Item: {
        [primaryKeyName]: pKey,
        [sortKeyName]: sKey,
        ...data,
      },
    })
  })

  it('Should create parameters for a query command', () => {
    const pKey = 'testPrimaryKeyValue'
    const keyCondition = new ExpressionBuilder()
      .addEqualCondition(primaryKeyName, pKey)
    const testAttribute = 'testAttribute'
    const testValue = 'testValue'
    const filter = new ExpressionBuilder()
      .addEqualCondition(testAttribute, testValue)

    const params = parameterHelper.queryParameters(keyCondition, filter)

    expect(params).toEqual({
      TableName: testTable,
      KeyConditionExpression: `${primaryKeyName} = :${primaryKeyName}`,
      ExpressionAttributeValues: {
        [`:${primaryKeyName}`]: pKey,
        [`:${testAttribute}`]: testValue,
      },
      FilterExpression: `${testAttribute} = :${testAttribute}`,
      Limit: queryLimit,
    })
  })
})

describe('ExpressionBuilder', () => {
  it('Should create a filter expression for filtering on equality', () => {
    const testAttribute = 'testAttribute'
    const testValue = 'testValue'

    const filter = new ExpressionBuilder()
      .addEqualCondition(testAttribute, testValue)

    const { expressionValues } = filter
    const expression = filter.getExpression()

    expect(expression).toBe(`${testAttribute} = :${testAttribute}`)
    expect(expressionValues).toEqual({
      [`:${testAttribute}`]: testValue,
    })
  })

  it('Should create a filter expression for filtering on a range', () => {
    const testAttribute = 'testAttribute'
    const startValue = 10
    const endValue = 20

    const filter = new ExpressionBuilder()
      .addBetweenCondition(testAttribute, startValue, endValue)

    const { expressionValues } = filter
    const expression = filter.getExpression()

    expect(expression).toBe(`${testAttribute} BETWEEN :${testAttribute}Start AND :${testAttribute}End`)
    expect(expressionValues).toEqual({
      [`:${testAttribute}Start`]: startValue,
      [`:${testAttribute}End`]: endValue,
    })
  })

  it('Should fluently chain conditions', () => {
    const testAttribute1 = 'attr1'
    const testValue1 = 'value1'
    const testAttribute2 = 'attr2'
    const startValue2 = 5
    const endValue2 = 15
    const testAttribute3 = 'attr3'
    const testValue3 = 'value3'

    const filter = new ExpressionBuilder()
      .addEqualCondition(testAttribute1, testValue1)
      .addBetweenCondition(testAttribute2, startValue2, endValue2)
      .addEqualCondition(testAttribute3, testValue3)

    const { expressionValues } = filter
    const expression = filter.getExpression()

    const expectedExpression = `${testAttribute1} = :${testAttribute1} AND `
      + `${testAttribute2} BETWEEN :${testAttribute2}Start AND :${testAttribute2}End AND `
      + `${testAttribute3} = :${testAttribute3}`

    expect(expression).toBe(expectedExpression)
    expect(expressionValues).toEqual({
      [`:${testAttribute1}`]: testValue1,
      [`:${testAttribute2}Start`]: startValue2,
      [`:${testAttribute2}End`]: endValue2,
      [`:${testAttribute3}`]: testValue3,
    })
  })
})
