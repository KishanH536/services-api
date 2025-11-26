/**
 * Evenly sample numberToSample from a list of items.
 *
 * @param {[]} list
 * @param {number} numberToSample
 */
export default (list, numberToSample) => {
  const totalItems = list.length
  if (totalItems <= numberToSample) {
    return list
  }

  const sampledItems = []
  const increment = (totalItems - 1) / (numberToSample - 1)

  for (let i = 0; i < numberToSample; ++i) {
    const sampleIndex = Math.floor(i * increment)
    sampledItems.push(list[sampleIndex])
  }

  return sampledItems
}
