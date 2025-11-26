import {
  assembleResponse,
  assembleCollectionResponse,
  getSelfLink,
} from '../create_response.js'

const ctx = {
  api: {
    apiRoot: '/services',
  },
  operation: {
    path: '/companies',
  },
}

const companyId = 'theCompanyId'
const tokenId = 'theTokenId'
const theToken = 'theToken'
const displayName = "Rafael's Hardware"
const capabilities = [
  'faceDetect',
]

const attributes = {
  displayName,
  capabilities,
}

// Single company response assembly tests
function buildCompanySuccessTest() {
  const success = assembleResponse(
    ctx,
    {
      companyId,
      tokenId,
      token: theToken,
      displayName,
      capabilities,
    },
  )

  const expected = {
    data: {
      type: 'company',
      id: companyId,
      links: {
        self: '/services/companies/theCompanyId',
      },
      attributes,
      relationships: {
        token: {
          data: {
            type: 'token',
            id: tokenId,
          },
        },
      },
    },
    included: [
      {
        type: 'token',
        id: tokenId,
        attributes: { token: theToken },
      },
    ],
  }
  expect(success).toMatchObject(expected)
}

test('build a company success', buildCompanySuccessTest)

// Multiple company response assembly tests
function buildCompaniesSuccessTest({
  companyIdStart = 0,
  companyCount = 0,
  lastPage,
  pagination = {},
}) {
  const {
    pageSize,
    pageBefore,
    pageAfter,
  } = pagination

  const companies = []
  for (let company = 0; company < companyCount; company++) {
    companies.push(
      {
        companyId: `theCompanyId-${company + companyIdStart}`,
        displayName,
        daysToRetainData: 30,
        capabilities,
      },
    )
  }

  const success = assembleCollectionResponse(
    ctx,
    companies,
    {
      pageSize,
      pageBefore,
      pageAfter,
      lastPage,
    },
  )

  const nextId = `theCompanyId-${companyIdStart + companyCount - 1}`
  const prevId = `theCompanyId-${companyIdStart}`

  const initialPageSelfLink = `/services/companies?page[size]=${pageSize}`
  const pageAfterSelfLink = `/services/companies?page[size]=${pageSize}&page[after]=${pageAfter}`
  const pageBeforeSelfLink = `/services/companies?page[size]=${pageSize}&page[before]=${pageBefore}`
  const nextLink = `/services/companies?page[size]=${pageSize}&page[after]=${nextId}`
  const prevLink = `/services/companies?page[size]=${pageSize}&page[before]=${prevId}`

  expect(success.data).toHaveLength(companyCount)
  // middle pages
  if (pageSize && companies.length && !lastPage) {
    expect(success.links.prev).toEqual(prevLink)
    expect(success.links.next).toEqual(nextLink)
    if (pageAfter) {
      expect(success.links.self).toEqual(pageAfterSelfLink)
    }
    else {
      expect(success.links.self).toEqual(pageBeforeSelfLink)
    }
  }
  else if (pageSize && companies.length && lastPage) {
    if (pageAfter) {
      expect(success.links.self).toEqual(pageAfterSelfLink)
      expect(success.links.next).toEqual(null)
      expect(success.links.prev).toEqual(prevLink)
    }
    else if (pageBefore) {
      expect(success.links.self).toEqual(pageBeforeSelfLink)
      expect(success.links.next).toEqual(nextLink)
      expect(success.links.prev).toEqual(null)
    }
    // neither pageBefore or pageAfter means first and last page
    else {
      expect(success.links.self).toEqual(initialPageSelfLink)
      expect(success.links.next).toEqual(null)
      expect(success.links.prev).toEqual(null)
    }
  }
  else {
    expect(success.links.self).toEqual('/services/companies')
    expect(success.links).not.toHaveProperty('next')
    expect(success.links).not.toHaveProperty('prev')
  }
}

const buildCompaniesTests = [
  // Non-paginated
  {
    testDesc: 'none',
    companyCount: 3,
    lastPage: true,
    pagination: {},
  },
  // Paginaged, all results fit in one page
  {
    testDesc: 'none',
    companyCount: 3,
    lastPage: true,
    pagination: {
      pageSize: 3,
    },
  },
  // Middle pages
  {
    testDesc: 'page after full page',
    companyCount: 3,
    companyIdStart: 5,
    lastPage: false,
    pagination: {
      pageSize: 3,
      pageAfter: 'theCompanyId-1',
    },
  },
  {
    testDesc: 'page before full page',
    companyCount: 3,
    companyIdStart: 5,
    lastPage: false,
    pagination: {
      pageSize: 3,
      pageBefore: 'theCompanyId-10',
    },
  },
  // End pages with content
  {
    testDesc: 'page after partial page',
    companyCount: 3,
    companyIdStart: 5,
    lastPage: true,
    pagination: {
      pageSize: 5,
      pageAfter: 'theCompanyId-1',
    },
  },
  {
    testDesc: 'page before partial page',
    companyCount: 3,
    companyIdStart: 5,
    lastPage: true,
    pagination: {
      pageSize: 5,
      pageBefore: 'theCompanyId-10',
    },
  },
]
test.each(buildCompaniesTests)('build a companies response, pagination: $testDesc', buildCompaniesSuccessTest)

// Self link creation tests
function getSelfLinkTest({ apiRoot, pagination = {}, expected }) {
  const apiRootTestCtx = {
    api: {
      apiRoot,
    },
    operation: {
      path: '/companies',
    },
  }
  const {
    pageSize,
    pageBefore,
    pageAfter,
  } = pagination
  const id = 'theId'
  const {
    fullPath: result,
  } = getSelfLink(
    apiRootTestCtx,
    {
      id,
      pageSize,
      pageBefore,
      pageAfter,
    },
  )
  expect(result).toStrictEqual(expected)
}

const selfLinkApiRootSamples = [
  {
    apiRoot: '',
    expected: '/companies/theId',
  },
  {
    apiRoot: '/services',
    expected: '/services/companies/theId',
  },
  {
    apiRoot: '/services',
    pagination: {
      pageSize: 3,
      pageAfter: 'pageAfterCursor',
    },
    expected: '/services/companies/theId?page[size]=3&page[after]=pageAfterCursor',
  },
  {
    apiRoot: '/services',
    pagination: {
      pageAfter: 'pageAfterCursor',
    },
    expected: '/services/companies/theId',
  },
  {
    apiRoot: '/services',
    pagination: {
      pageSize: 3,
      pageBefore: 'pageBeforeCursor',
    },
    expected: '/services/companies/theId?page[size]=3&page[before]=pageBeforeCursor',
  },
]
test.each(selfLinkApiRootSamples)(
  'get self link with apiRoot, "$apiRoot"',
  getSelfLinkTest,
)
