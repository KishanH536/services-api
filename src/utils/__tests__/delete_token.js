import { jest } from '@jest/globals'

const mockToken = { id: 'testTokenId' }

jest.unstable_mockModule('../../db', () => ({
  initDB: jest.fn(),
}))

const { default: deleteToken } = await import('../delete_token.js')

const { initDB } = await import('../../db/index.js')

it('Should delete token', async () => {
  // Arrange
  const mockSql = {
    models: {
      token: {
        update: jest.fn(),
      },
    },
    literal: jest.fn(),
  }
  initDB.mockResolvedValue(mockSql)
  mockSql.models.token.update.mockImplementation(() => jest.fn())

  // Act
  await deleteToken(mockSql, 't', mockToken)

  // Assert
  expect(mockSql.models.token.update).toHaveBeenCalledTimes(1)
  expect(mockSql.literal).toHaveBeenCalledTimes(1)
})
