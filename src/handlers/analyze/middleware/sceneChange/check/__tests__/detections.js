import { jest } from '@jest/globals'
import moment from 'moment-timezone'

// Need to import before mocking
// import * as originalGeneric from '../../../../../../utils/generic'

// jest.unstable_mockModule('../../../../../../utils/generic', () => ({
//   ...originalGeneric,
//   getCurrentTime: jest.fn(),
// }))

jest.unstable_mockModule('../../../../../../core/get_tampering_detections', () => ({
  getTamperingDetections: jest.fn(),
}))

const {
  isTamperingAlreadyDone,
} = await import('../detections.js')

const {
  getTamperingDetections,
} = await import('../../../../../../core/get_tampering_detections.js')

const companyTamperingConfig = {
  firstCheckTo: '20:00',
  secondCheckTo: '08:00',
  firstCheckFrom: '08:00',
  secondCheckFrom: '20:00',
}

const testTimeZone = 'America/New_York'
const testViewId = 'test-view-id'

describe('Check if tampering is already done', () => {
  beforeEach(() => {
    getTamperingDetections.mockClear()
  })

  it('Returns true if tampering is already done', async () => {
    // Arrange
    getTamperingDetections.mockResolvedValue([{}])

    // Act
    const result = await isTamperingAlreadyDone(
      testViewId,
      companyTamperingConfig,
      testTimeZone,
      new Date(),
    )

    // Assert
    expect(result).toBe(true)
  })

  it('Returns false if tampering is not already done.', async () => {
    // Arrange
    getTamperingDetections.mockResolvedValue([])

    // Act
    const result = await isTamperingAlreadyDone(
      testViewId,
      companyTamperingConfig,
      testTimeZone,
      new Date(),
    )

    // Assert
    expect(result).toBe(false)
  })

  it.each([
    [10, 8, 0], // 10am backlimit should be "firstCheckFrom" (8am)
    [23, 20, 0], // 11pm backlimit should be "secondCheckFrom" (8pm),
    [2, 20, 1], // 2am backlimit should be "secondCheckFrom" (8pm) the day before
  ])(
    'Calculates the correct back limit for the first check',
    async (testHour, expectedHour, expectedDayOffset) => {
      // Arrange
      const currentTime = moment().tz(testTimeZone)
      const currentDay = currentTime.clone().startOf('day')
      const testTime = currentDay.clone().hours(testHour).toDate()

      // Act
      await isTamperingAlreadyDone(
        testViewId,
        companyTamperingConfig,
        testTimeZone,
        testTime,
      )

      // Assert
      expect(getTamperingDetections.mock.lastCall[1])
        .toEqual(
          currentDay
            .clone()
            .hours(expectedHour)
            .subtract(expectedDayOffset, 'day')
            .toDate(),
        )
    },
  )
})
