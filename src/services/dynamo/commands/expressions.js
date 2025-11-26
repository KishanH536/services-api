export class ExpressionBuilder {
  constructor() {
    this.conditions = []
    this.expressionValues = {}
  }

  addEqualCondition(attribute, value) {
    if (value === undefined || value === null) {
      return this
    }
    this.conditions.push(`${attribute} = :${attribute}`)
    this.expressionValues[`:${attribute}`] = value
    return this
  }

  addBetweenCondition(attribute, start, end) {
    this.conditions.push(`${attribute} BETWEEN :${attribute}Start AND :${attribute}End`)
    this.expressionValues[`:${attribute}Start`] = start
    this.expressionValues[`:${attribute}End`] = end
    return this
  }

  getExpression() {
    return this.conditions.length > 0 ? this.conditions.join(' AND ') : undefined
  }

  // Copy an existing ExpressionBuilder
  static from(builder) {
    const newBuilder = new ExpressionBuilder()
    newBuilder.conditions = [...builder.conditions]
    newBuilder.expressionValues = { ...builder.expressionValues }
    return newBuilder
  }
}
