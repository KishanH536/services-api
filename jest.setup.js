import { validate } from 'uuid'

import isAbsoluteUrl from 'is-url'

import { isRel as isRelativeUrl } from 'is-relative-uri'

expect.extend({
  anyUuid(received) {
    if (validate(received)) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      }
    }
    return {
      message: () => `expected ${received} to be a valid UUID`,
      pass: false,
    }
  },
  anyUrl(received) {
    if (isRelativeUrl(received) || isAbsoluteUrl(received)) {
      return {
        message: () => `expected ${received} to be an invalid URL`,
        pass: true,
      }
    }
    return {
      message: () => `expected ${received} to be a valid URL`,
      pass: false,
    }
  },
})
