import { jest } from '@jest/globals'

const testuserId = 'test-user-id'

const mockDbQuery = jest.fn(() => [
  {
    id: 'test',
    permissionId: 'ADMIN_USER',
  },
])

jest.unstable_mockModule('../../db', () => ({
  initDB: jest.fn().mockImplementation(() => ({
    query: mockDbQuery,
  })),
}))

const { getUserInfoByUserId } = await import('../get_user.js')

describe('Find a user', () => {
  afterEach(() => {
    mockDbQuery.mockClear()
  })

  it('Should call the DB function to get the user', async () => {
    // Act
    await getUserInfoByUserId({ userId: testuserId })

    // Assert
    expect(mockDbQuery.mock.calls).toHaveLength(1)
  })
})
