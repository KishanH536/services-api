import { jest } from '@jest/globals'

jest.unstable_mockModule('crypto', () => ({
  createHmac: jest.fn(),
}))

jest.unstable_mockModule('bcrypt', () => ({
  default: {
    genSalt: jest.fn(),
    hash: jest.fn(),
    compare: jest.fn(),
  },
}))

const { createHmac } = await import('crypto')
const { default: bcrypt } = await import('bcrypt')
const { hash, compare } = await import('../hash_password.js')

const testPlainTextPassword = 'testPlainTextPassword'
const testHashedPassword = 'testHashedPasswordtestHashedPassword'
const testPrehashedPassword = 'testPrehashedPassword'
const testAlgoCostSalt = 'testAlgoCostSalt'

describe('Check return type and function calls', () => {
  beforeEach(() => {
    createHmac.mockImplementation(() => ({
      update: jest.fn(() => ({
        digest: jest.fn(() => testPrehashedPassword),
      })),
    }))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('Should have the correct return value (hash function)', async () => {
    bcrypt.genSalt.mockResolvedValue(testAlgoCostSalt)
    bcrypt.hash.mockResolvedValue(testHashedPassword)
    const result = await hash(testPlainTextPassword)

    expect(result).toEqual(testHashedPassword)
    expect(bcrypt.genSalt).toHaveBeenCalledTimes(1)
    expect(bcrypt.hash).toHaveBeenCalledTimes(1)
    expect(createHmac).toHaveBeenCalledTimes(1)
  })

  it('Should have the correct return value (compare function)', async () => {
    bcrypt.compare.mockResolvedValue(true)
    const result = await compare(testPlainTextPassword, testHashedPassword)

    expect(result).toEqual(true)
    expect(bcrypt.compare).toHaveBeenCalledTimes(1)
    expect(createHmac).toHaveBeenCalledTimes(1)
  })
})
