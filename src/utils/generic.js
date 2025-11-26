const parseDecInt = (str) => Number.parseInt(str, 10)

const composeWith = chainer => (...fnsOriginal) => (...args) => {
  const fns = fnsOriginal.slice()
  const firstResult = fns.pop()(...args)
  return fns.reduceRight(chainer, firstResult)
}

const chain = (prevResult, fn) => fn(prevResult)
const compose = composeWith(chain)

const map = fn => array => array.map(fn)

const toLowerCase = str => str.toLowerCase()

/**
 *
 * @param {function} predicate - A function that
 * takes a key and value, and returns true if the
 * key/value pair should be included in the result.
 * @returns The filtered object
 */
const filterObject = (predicate) => {
  const filter = entries => entries.filter(
    ([key, value]) => predicate(key, value),
  )

  return compose(
    Object.fromEntries,
    filter,
    Object.entries,
  )
}

/**
 *
 * @param {function} predicate - A function that
 * takes a value and returns true if the key/value
 * pair should be included in the result.
 * @returns The filtered object
 */
const filterObjectValues = (predicate) => filterObject(
  (_, value) => predicate(value),
)

const split = (arr, index) => [
  arr.slice(0, index),
  arr.slice(index),
]

export {
  parseDecInt,
  compose,
  map,
  toLowerCase,
  filterObjectValues,
  split,
}
