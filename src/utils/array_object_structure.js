import { isObject } from 'lodash-es'

export function objectInArrayContainsAttribute(arrayOfObjects, attribute) {
  if (!Array.isArray(arrayOfObjects)) {
    return false
  }
  if (arrayOfObjects?.length) {
    const attributePresent = arrayOfObjects.some(
      (element) => {
        if (!isObject(element)) {
          return false
        }
        return attribute in element
      },
    )
    return attributePresent
  }
  return false
}
