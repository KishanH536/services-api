import { jest } from '@jest/globals'

import { QueryTypes } from 'sequelize'

const mockLogger = {
  error: jest.fn(),
}

const mockQuery = jest.fn()
jest.unstable_mockModule('../../services', () => ({
  services: {
    DB: {
      query: mockQuery,
    },
  },
}))

const {
  getCurrentUser,
  logUserUpdate,
} = await import('../audit_log.js')

describe('Get Current User', () => {
  beforeEach(() => {
    mockQuery.mockClear()
    mockLogger.error.mockClear()
  })

  it('Queries the DB', async () => {
    // Act
    await getCurrentUser({ userId: 'test-user-id' })

    // Assert
    expect(mockQuery.mock.calls).toHaveLength(1)
  })

  it('Returns the user version if it exists', async () => {
    // Arrange
    const mockUser = { id: 'test-user-id' }
    mockQuery.mockResolvedValue([{ data: mockUser }])

    // Act
    const user = await getCurrentUser({ userId: 'test-user-id' })
    expect(user).toBe(mockUser)
  })

  it.each([[], undefined])(
    'Returns null if the user version does not exist',
    async (rows) => {
      // Arrange
      mockQuery.mockResolvedValue(rows)

      // Act
      const user = await getCurrentUser({ userId: 'test-user-id' })
      expect(user).toBeNull()
    },
  )

  it('Logs an error if the query fails', async () => {
    // Arrange
    mockQuery.mockImplementation(() => {
      throw new Error('Test Error')
    })

    // Act
    await getCurrentUser({ log: mockLogger })

    // Assert
    expect(mockLogger.error.mock.calls).toHaveLength(1)
  })
})

describe('Log User Update', () => {
  beforeEach(() => {
    mockQuery.mockClear()
    mockLogger.error.mockClear()
  })

  it('Performs an insert into the audit log', async () => {
    // Act
    await logUserUpdate({
      user: { id: 'test-user-id' },
      log: mockLogger,
    })

    // Assert
    expect(mockQuery.mock.calls).toHaveLength(1)
    const options = mockQuery.mock.calls[0][1]
    expect(options.type).toBe(QueryTypes.INSERT)
  })

  it('Logs an error if the query fails', async () => {
    // Arrange
    mockQuery.mockImplementationOnce(() => {
      throw new Error('Test Error')
    })

    // Act
    await logUserUpdate({
      user: { id: 'test-user-id' },
      log: mockLogger,
    })

    // Assert
    expect(mockLogger.error.mock.calls).toHaveLength(1)
  })
})
