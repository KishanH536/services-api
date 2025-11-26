import { jest } from '@jest/globals'

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    decode: jest.fn(),
    verify: jest.fn(),
  },
}))

jest.unstable_mockModule('../../common/error_response', () => ({
  error401: jest.fn(),
}))

jest.unstable_mockModule('../../core/get_user', () => ({
  getUserInfoByUserId: jest.fn(),
}))

jest.unstable_mockModule('../../core/find_company', () => ({
  getCompanyByIntegratorId: jest.fn(),
}))

jest.unstable_mockModule('../../core/get_token', () => ({
  getTokenById: jest.fn(),
}))

jest.unstable_mockModule('../../utils/find_admin_user_by_company', () => ({
  default: jest.fn(),
}))

jest.unstable_mockModule('../../utils/check_tenant_id', () => ({
  default: jest.fn(),
}))

const { default: jwt } = await import('jsonwebtoken')
const { error401 } = await import('../../common/error_response.js')
const { getUserInfoByUserId } = await import('../../core/get_user.js')
const { getCompanyByIntegratorId } = await import('../../core/find_company.js')
const { getTokenById } = await import('../../core/get_token.js')
const { default: getAdminUserIdFromCompanyId } = await import('../../utils/find_admin_user_by_company.js')
const { default: checkIsValidTenant } = await import('../../utils/check_tenant_id.js')
const { default: tokenValidator } = await import('../auth/index.js')

const next = jest.fn()

const defaultRequestStub = {
  headers: {},
  header: jest.fn(),
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}

describe('Basic token errors', () => {
  let req
  let res
  beforeEach(() => {
    next.mockClear()
    error401.mockClear()
    getTokenById.mockResolvedValue({ id: 'some-valid-token-id' })
    req = { ...defaultRequestStub }
    res = {}
  })

  it('Should return 401 if no authorization header present', async () => {
    await tokenValidator(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(error401).toHaveBeenCalled()
  })

  it('Should return 401 if not bearer auth', async () => {
    req.headers.authorization = 'Basic foo'
    await tokenValidator(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(error401).toHaveBeenCalled()
  })

  it('Should return 401 if token is blank', async () => {
    req.headers.authorization = 'BeAreR'
    await tokenValidator(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(error401).toHaveBeenCalled()
  })

  it('Should return 401 if token decode is empty', async () => {
    req.headers.authorization = 'bearer token'
    jwt.decode.mockReturnValue(null)
    await tokenValidator(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(error401).toHaveBeenCalled()
  })

  it('Should return 401 if token decode throws an error', async () => {
    req.headers.authorization = 'bearer token'
    jwt.decode.mockImplementation(() => {
      throw new Error('Test Error')
    })
    await tokenValidator(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(error401).toHaveBeenCalled()
  })
})

describe('Test Unified ID tokens', () => {
  let req
  let res

  beforeAll(() => {
    jwt.decode.mockReturnValue({ payload: { iss: 'unified_id_iss' } })
  })

  beforeEach(() => {
    next.mockClear()
    error401.mockClear()
    getTokenById.mockResolvedValue({ id: 'some-valid-token-id' })
    req = { ...defaultRequestStub }
    res = {}
  })

  it('Should return 401 on UID token decode error', async () => {
    req.headers.authorization = 'bearer token'
    jwt.verify.mockImplementation(() => {
      throw new Error('Test Error')
    })
    await tokenValidator(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(error401).toHaveBeenCalled()
  })

  it('Should return 401 if no client_id in token', async () => {
    req.headers.authorization = 'bearer token'
    jwt.verify.mockImplementation((a, b, c, callback) => {
      callback(null, {})
    })
    await tokenValidator(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(error401).toHaveBeenCalled()
  })

  it("Should return 500 if can't get admin user", async () => {
    req.headers.authorization = 'bearer token'
    jwt.verify.mockImplementation((a, b, c, callback) => {
      callback(null, { client_id: 'client_id' })
    })
    getAdminUserIdFromCompanyId.mockImplementation(() => {
      throw new Error('Test Error')
    })
    await tokenValidator(req, res, next)
    expect(next).toHaveBeenCalledWith(new Error('Test Error'))
    expect(error401).not.toHaveBeenCalled()
  })

  it('Should return 401 if no admin user found', async () => {
    req.headers.authorization = 'bearer token'
    jwt.verify.mockImplementation((a, b, c, callback) => {
      callback(null, { client_id: 'client_id' })
    })
    getAdminUserIdFromCompanyId.mockResolvedValue(null)
    await tokenValidator(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(error401).toHaveBeenCalled()
  })

  it('Should call next() with no error if userId is found', async () => {
    req.headers.authorization = 'bearer token'
    jwt.verify.mockImplementation((a, b, c, callback) => {
      callback(null, { client_id: 'client_id' })
    })
    getAdminUserIdFromCompanyId.mockResolvedValue('user_id')
    await tokenValidator(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(error401).not.toHaveBeenCalled()
  })

  it("With X-Tenant-ID - Should return 500 if can't get valid tenant", async () => {
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValue('valid_tenant')
    jwt.verify.mockImplementation((a, b, c, callback) => {
      callback(null, { client_id: 'company_id' })
    })
    checkIsValidTenant.mockImplementation(() => {
      throw new Error('Test Error')
    })
    await tokenValidator(req, res, next)
    expect(next).toHaveBeenCalledWith(new Error('Test Error'))
    expect(error401).not.toHaveBeenCalled()
  })

  it('With X-Tenant-ID - Should return 401 if no valid tenant found', async () => {
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValue('valid_tenant')
    jwt.verify.mockImplementation((a, b, c, callback) => {
      callback(null, { client_id: 'company_id' })
    })
    checkIsValidTenant.mockResolvedValue(false)
    await tokenValidator(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(error401).toHaveBeenCalled()
  })

  it("With X-Tenant-ID - Should return 500 if can't get admin user", async () => {
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValue('valid_tenant')
    jwt.verify.mockImplementation((a, b, c, callback) => {
      callback(null, { client_id: 'company_id' })
    })
    checkIsValidTenant.mockResolvedValue(true)
    getAdminUserIdFromCompanyId.mockImplementation(() => {
      throw new Error('Test Error')
    })
    await tokenValidator(req, res, next)
    expect(next).toHaveBeenCalledWith(new Error('Test Error'))
    expect(error401).not.toHaveBeenCalled()
  })

  it('With X-Tenant-ID - Should return 401 if no admin user', async () => {
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValue('valid_tenant')
    jwt.verify.mockImplementation((a, b, c, callback) => {
      callback(null, { client_id: 'company_id' })
    })
    checkIsValidTenant.mockResolvedValue(true)
    getAdminUserIdFromCompanyId.mockResolvedValue(null)
    await tokenValidator(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(error401).toHaveBeenCalled()
  })

  it("With X-Tenant-Integrator-ID - Should return 500 if can't get valid tenant", async () => {
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValueOnce(null) // for X-Tenant-ID
    req.header.mockReturnValue('valid_tenant_integrator_id') // for X-Tenant-Integrator-ID

    jwt.verify.mockImplementation((a, b, c, callback) => {
      callback(null, { client_id: 'company_id' })
    })
    getCompanyByIntegratorId.mockImplementation(() => {
      throw new Error('Test Error')
    })
    await tokenValidator(req, res, next)
    expect(next).toHaveBeenCalledWith(new Error('Test Error'))
    expect(error401).not.toHaveBeenCalled()
  })

  it('With X-Tenant-Integrator-ID - Should return 401 if no valid tenant found', async () => {
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValueOnce(null) // for X-Tenant-ID
    req.header.mockReturnValue('valid_tenant_integrator_id') // for X-Tenant-Integrator-ID

    jwt.verify.mockImplementation((a, b, c, callback) => {
      callback(null, { client_id: 'company_id' })
    })
    getCompanyByIntegratorId.mockResolvedValue(null)
    await tokenValidator(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(error401).toHaveBeenCalled()
  })

  it("With X-Tenant-Integrator-ID - Should return 500 if can't get admin user", async () => {
    const integratorCompanyId = 'valid_company'
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValueOnce(null) // for X-Tenant-ID
    req.header.mockReturnValue('valid_tenant_integrator_id') // for X-Tenant-Integrator-ID

    jwt.verify.mockImplementation((a, b, c, callback) => {
      callback(null, { client_id: integratorCompanyId })
    })
    getCompanyByIntegratorId.mockResolvedValue({
      id: 'valid_tenant_id',
      createdBy: integratorCompanyId,
    })
    getAdminUserIdFromCompanyId.mockImplementation(() => {
      throw new Error('Test Error')
    })
    await tokenValidator(req, res, next)
    expect(next).toHaveBeenCalledWith(new Error('Test Error'))
    expect(error401).not.toHaveBeenCalled()
  })

  it('With X-Tenant-Integrator-ID - Should return 401 if no admin user', async () => {
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValueOnce(null) // for X-Tenant-ID
    req.header.mockReturnValue('valid_tenant_integrator_id') // for X-Tenant-Integrator-ID

    jwt.verify.mockImplementation((a, b, c, callback) => {
      callback(null, { client_id: 'valid_company' })
    })
    getCompanyByIntegratorId.mockResolvedValue({
      id: 'valid_tenant_id',
      createdBy: 'integrator_user_id',
    })
    getAdminUserIdFromCompanyId.mockResolvedValue(null)
    await tokenValidator(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(error401).toHaveBeenCalled()
  })

  it('With X-Tenant-Integrator-ID - Should authenticate successfully', async () => {
    const integratorUserId = 'valid_user'
    const tenantUserId = 'tenant_admin_user_id'
    const integratorCompanyId = 'valid_company'

    req.headers.authorization = 'bearer token'
    req.header.mockReturnValueOnce(null) // for X-Tenant-ID
    req.header.mockReturnValue('valid_tenant_integrator_id') // for X-Tenant-Integrator-ID

    jwt.verify.mockImplementation((a, b, c, callback) => {
      callback(null, { client_id: integratorCompanyId })
    })
    getAdminUserIdFromCompanyId.mockResolvedValueOnce(integratorUserId)
    getCompanyByIntegratorId.mockResolvedValue({
      id: 'valid_tenant_id',
      createdBy: integratorUserId,
    })
    getAdminUserIdFromCompanyId.mockResolvedValue(tenantUserId)
    await tokenValidator(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(req.auth.userId).toBe(tenantUserId)
    expect(req.integratorCompany).toEqual({ id: integratorCompanyId })
    expect(req.integratorCompanyId).toBe(integratorCompanyId)
  })
})

describe('Test Calipsa tokens', () => {
  let req
  let res

  beforeAll(() => {
    jwt.decode.mockReturnValue({ payload: {} })
  })

  beforeEach(() => {
    next.mockClear()
    error401.mockClear()
    getTokenById.mockResolvedValue({ id: 'some-valid-token-id' })
    req = { ...defaultRequestStub }
    res = {}
  })

  it('Should return 401 on Calipsa token decode error', async () => {
    req.headers.authorization = 'bearer token'
    jwt.verify.mockImplementation(() => {
      throw new Error('Test Error')
    })
    await tokenValidator(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(error401).toHaveBeenCalled()
  })

  it('Should call next() with no error if userId is found', async () => {
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValue(null)
    jwt.verify.mockReturnValue({ userId: 'valid_user' })
    await tokenValidator(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(error401).not.toHaveBeenCalled()
  })

  it("With X-Tenant-ID - Should return 500 if can't get user info", async () => {
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValue('valid_tenant')
    jwt.verify.mockReturnValue({ userId: 'valid_user' })
    getUserInfoByUserId.mockImplementation(() => {
      throw new Error('Test Error')
    })
    await tokenValidator(req, res, next)
    expect(next).toHaveBeenCalledWith(new Error('Test Error'))
    expect(error401).not.toHaveBeenCalled()
  })

  it("With X-Tenant-ID - Should return 500 if can't get check for valid tenant", async () => {
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValue('valid_tenant')
    jwt.verify.mockReturnValue({ userId: 'valid_user' })
    getUserInfoByUserId.mockReturnValue({ companyId: 'valid_company' })
    checkIsValidTenant.mockImplementation(() => {
      throw new Error('Test Error')
    })
    await tokenValidator(req, res, next)
    expect(next).toHaveBeenCalledWith(new Error('Test Error'))
    expect(error401).not.toHaveBeenCalled()
  })

  it('With X-Tenant-ID - Should return 401 if no valid tenant', async () => {
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValue('valid_tenant')
    jwt.verify.mockReturnValue({ userId: 'valid_user' })
    getUserInfoByUserId.mockReturnValue({ companyId: 'valid_company' })
    checkIsValidTenant.mockResolvedValue(false)
    await tokenValidator(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(error401).toHaveBeenCalled()
  })

  it("With X-Tenant-ID - Should return 500 if can't get admin user", async () => {
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValue('valid_tenant')
    jwt.verify.mockReturnValue({ userId: 'valid_user' })
    getUserInfoByUserId.mockReturnValue({ companyId: 'valid_company' })
    checkIsValidTenant.mockResolvedValue(true)
    getAdminUserIdFromCompanyId.mockImplementation(() => {
      throw new Error('Test Error')
    })
    await tokenValidator(req, res, next)
    expect(next).toHaveBeenCalledWith(new Error('Test Error'))
    expect(error401).not.toHaveBeenCalled()
  })

  it('With X-Tenant-ID - Should return 401 if null admin user', async () => {
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValue('valid_tenant')
    jwt.verify.mockReturnValue({ userId: 'valid_user' })
    getUserInfoByUserId.mockReturnValue({ companyId: 'valid_company' })
    checkIsValidTenant.mockResolvedValue(true)
    getAdminUserIdFromCompanyId.mockResolvedValue(null)
    await tokenValidator(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(error401).toHaveBeenCalled()
  })

  it("With X-Tenant-Integrator-ID - Should return 500 if can't get user info", async () => {
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValueOnce(null) // for X-Tenant-ID
    req.header.mockReturnValue('valid_tenant_integrator_id') // for X-Tenant-Integrator-ID

    jwt.verify.mockReturnValue({ userId: 'valid_user' })
    getUserInfoByUserId.mockImplementation(() => {
      throw new Error('Test Error')
    })
    await tokenValidator(req, res, next)
    expect(next).toHaveBeenCalledWith(new Error('Test Error'))
    expect(error401).not.toHaveBeenCalled()
  })

  it("With X-Tenant-Integrator-ID - Should return 500 if can't get the tenant company by integrator ID.", async () => {
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValueOnce(null) // for X-Tenant-ID
    req.header.mockReturnValue('valid_tenant_integrator_id') // for X-Tenant-Integrator-ID

    jwt.verify.mockReturnValue({ userId: 'valid_user' })
    getUserInfoByUserId.mockReturnValue({ companyId: 'valid_company' })
    getCompanyByIntegratorId.mockImplementation(() => {
      throw new Error('Test Error')
    })
    await tokenValidator(req, res, next)
    expect(next).toHaveBeenCalledWith(new Error('Test Error'))
    expect(error401).not.toHaveBeenCalled()
  })

  it('With X-Tenant-Integrator-ID - Should return 401 if no valid tenant', async () => {
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValueOnce(null) // for X-Tenant-ID
    req.header.mockReturnValue('valid_tenant_integrator_id') // for X-Tenant-Integrator-ID

    jwt.verify.mockReturnValue({ userId: 'valid_user' })
    getUserInfoByUserId.mockReturnValue({ companyId: 'valid_company' })
    getCompanyByIntegratorId.mockResolvedValue(null)
    await tokenValidator(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(error401).toHaveBeenCalled()
  })

  it("With X-Tenant-Integrator-ID - Should return 500 if can't get admin user", async () => {
    const integratorUserId = 'valid_user'
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValueOnce(null) // for X-Tenant-ID
    req.header.mockReturnValue('valid_tenant_integrator_id') // for X-Tenant-Integrator-ID

    jwt.verify.mockReturnValue({ userId: integratorUserId })
    getUserInfoByUserId.mockReturnValue({ companyId: 'valid_company' })
    getCompanyByIntegratorId.mockResolvedValue({
      id: 'valid_tenant_id',
      createdBy: integratorUserId,
    })
    getAdminUserIdFromCompanyId.mockImplementation(() => {
      throw new Error('Test Error')
    })
    await tokenValidator(req, res, next)
    expect(next).toHaveBeenCalledWith(new Error('Test Error'))
    expect(error401).not.toHaveBeenCalled()
  })

  it('With X-Tenant-Integrator-ID - Should return 401 if null admin user', async () => {
    const integratorUserId = 'valid_user'
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValueOnce(null) // for X-Tenant-ID
    req.header.mockReturnValue('valid_tenant_integrator_id') // for X-Tenant-Integrator-ID

    jwt.verify.mockReturnValue({ userId: integratorUserId })
    getUserInfoByUserId.mockReturnValue({ companyId: 'valid_company' })
    getCompanyByIntegratorId.mockResolvedValue({
      id: 'valid_tenant_id',
      createdBy: integratorUserId,
    })
    getAdminUserIdFromCompanyId.mockResolvedValue(null)
    await tokenValidator(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(error401).toHaveBeenCalled()
  })

  it('With X-Tenant-Integrator-ID - Should successfully authenticate', async () => {
    const integratorUserId = 'valid_user'
    const tenantUserId = 'tenant_admin_user_id'
    const integratorCompanyId = 'valid_company'
    req.headers.authorization = 'bearer token'
    req.header.mockReturnValueOnce(null) // for X-Tenant-ID
    req.header.mockReturnValue('valid_tenant_integrator_id') // for X-Tenant-Integrator-ID

    jwt.verify.mockReturnValue({ userId: integratorUserId })
    getUserInfoByUserId.mockReturnValue({ companyId: integratorCompanyId })
    getCompanyByIntegratorId.mockResolvedValue({
      id: 'valid_tenant_id',
      createdBy: integratorUserId,
    })
    getAdminUserIdFromCompanyId.mockResolvedValue(tenantUserId)
    await tokenValidator(req, res, next)
    expect(req.auth.userId).toBe(tenantUserId)
    expect(req.integratorCompany).toEqual({ id: integratorCompanyId })
    expect(req.integratorCompanyId).toBe(integratorCompanyId)
    expect(next).toHaveBeenCalled()
  })
})
