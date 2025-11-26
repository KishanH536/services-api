import { jest } from '@jest/globals'

// Need to import before mocking get_user module.
import { userRoles } from '../../core/get_user.js'

jest.unstable_mockModule('../../core/get_user', () => ({
  userRoles,
  getUserInfoByUserId: jest.fn(),
  getUserInfoByTokenId: jest.fn(),
}))

jest.unstable_mockModule('../../common/error_response', () => ({
  error401: jest.fn(),
  error403: jest.fn(),
}))

jest.unstable_mockModule('../../core/find_company', () => ({
  getCompanyByUserId: jest.fn(),
}))

const {
  getUserInfoByUserId,
} = await import('../../core/get_user.js')

const { getCompanyByUserId } = await import('../../core/find_company.js')
const { CALIPSA_API_TOKEN_TYPE } = await import('../../utils/create_token.js')
const { error401, error403 } = await import('../../common/error_response.js')
const { default: validateUser } = await import('../validate_user.js')

const next = jest.fn()

const defaultRequest = {
  auth: {
    userId: 'db20d56d-acad-4171-be8f-91d3a457e8ce',
    tokenType: CALIPSA_API_TOKEN_TYPE,
  },
  logger: {
    error: jest.fn(),
  },
}
let request
let response

describe('Validate a user.', () => {
  beforeEach(() => {
    next.mockClear()
    error401.mockClear()
    error403.mockClear()
    request = { ...defaultRequest }
  })

  it('Should call next() with error if there is an exception getting the user', async () => {
    // Arrange
    getUserInfoByUserId.mockImplementation(() => {
      throw new Error('Test Error')
    })

    // Act
    await validateUser(request, response, next)

    // Assert
    expect(next.mock.lastCall[0]).toBeInstanceOf(Error)
  })

  it("Should return error 401 if the user can't be found.", async () => {
    // Arrange
    getUserInfoByUserId.mockResolvedValue(null)

    // Act
    await validateUser(request, response, next)

    // Assert
    expect(error401.mock.calls).toHaveLength(1)
  })

  it.each([
    userRoles.MEMBER_USER,
    userRoles.CREATE_COMPANY,
  ])(
    "Should return error 403 if the user isn't an admin.",
    async (role) => {
      // Arrange
      getUserInfoByUserId.mockResolvedValue({ roles: [role] })

      // Act
      await validateUser(request, response, next)

      // Assert
      expect(error403.mock.calls).toHaveLength(1)
    },
  )

  it('Should allow any token type.', async () => {
    // Arrange
    getUserInfoByUserId.mockResolvedValue({ roles: [userRoles.ADMIN_USER] })
    const invalidTokenTypeRequest = {
      auth: {
        userId: defaultRequest.auth.userId,
        tokenType: 'another-token-type',
      },
      logger: {
        error: jest.fn(),
      },
    }

    // Act
    await validateUser(invalidTokenTypeRequest, response, next)

    // Assert
    expect(error403.mock.calls).toHaveLength(0)
    expect(error401.mock.calls).toHaveLength(0)
    expect(next.mock.calls).toHaveLength(1)
  })

  it('Should call next() with error if there is an exception getting the company', async () => {
    // Arrange
    const testCompanyId = 'test-company-id'
    getUserInfoByUserId.mockResolvedValue({
      companyId: testCompanyId,
      roles: [userRoles.ADMIN_USER],
    })
    getCompanyByUserId.mockImplementation(() => {
      throw new Error('Test Error')
    })

    // Act
    await validateUser(request, response, next)

    // Assert
    expect(next.mock.lastCall[0]).toBeInstanceOf(Error)
  })

  it('Should call next() with error if a company is not found', async () => {
    // Arrange
    const testCompanyId = 'test-company-id'
    getUserInfoByUserId.mockResolvedValue({
      companyId: testCompanyId,
      roles: [userRoles.ADMIN_USER],
    })
    getCompanyByUserId.mockResolvedValue(null)

    // Act
    await validateUser(request, response, next)

    // Assert
    expect(next.mock.lastCall[0]).toBeInstanceOf(Error)
  })

  it('Should return error 401 if the user ID in the token is not a UUID', async () => {
    const nonUserUuidRequest = {
      auth: {
        userId: 'not-a-uuid',
      },
      logger: {
        error: jest.fn(),
      },
    }

    // Act
    await validateUser(nonUserUuidRequest, response, next)

    // Assert
    expect(error401).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledTimes(0)
  })
})
