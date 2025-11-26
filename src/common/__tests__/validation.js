import {
  validateTimeZone,
  validateUrl,
} from '../validation.js'

describe('Time Zone Validation', () => {
  it.each([undefined, null])(
    'Returns false for missing time zones',
    (tz) => {
      const valid = validateTimeZone(tz)
      expect(valid).toBe(false)
    },
  )

  it.each(['Not_A/TimeZone', ''])(
    'Returns false for invalid time zones',
    () => {
      const valid = validateTimeZone('Not_A/TimeZone')
      expect(valid).toBe(false)
    },
  )

  it.each([
    'UTC',
    'Canada/Pacific',
    'America/Chicago',
    'PST',
    'Etc/GMT+3',
  ])(
    'Returns true for valid time zones',
    (tz) => {
      const valid = validateTimeZone(tz)
      expect(valid).toBe(true)
    },
  )
})

describe('URL Validation', () => {
  it
    .each([
      'not a url',
      undefined,
      null,
      'missing-http.com',
      123,
    ])(
      'Returns false for invalid URLs',
      (url) => {
        const valid = validateUrl(url)
        expect(valid).toBe(false)
      },
    )

  it('Returns true for valid URLs', () => {
    const valid = validateUrl('https://example.com')
    expect(valid).toBe(true)
  })
})
