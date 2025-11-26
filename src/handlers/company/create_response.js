export function getSelfLink(
  ctx,
  {
    id = null,
    selfPathToUse = null,
    pageSize,
    pageBefore,
    pageAfter,
  },
) {
  const {
    api: {
      apiRoot,
    },
  } = ctx

  if (selfPathToUse) {
    // override self path with what is provided, if it's provided
    return apiRoot + selfPathToUse
  }

  const path = '/companies'
  const endpointBase = apiRoot + path

  const segments = [
    endpointBase,
  ]

  segments.push(...id ? [id] : [])
  const noQuery = segments.join('/')

  let fullPath = noQuery
  if (pageSize) {
    fullPath += `?page[size]=${pageSize}`

    if (pageAfter) {
      fullPath += `&page[after]=${pageAfter}`
    }
    if (pageBefore) {
      fullPath += `&page[before]=${pageBefore}`
    }
  }

  return {
    fullPath,
    noQuery,
  }
}

function serializeCompany(
  ctx,
  {
    companyId,
    displayName,
    capabilities,
    daysToRetainData,
    integratorId,
  },
  selfPathToUse,
) {
  const attributes = {
    displayName,
    daysToRetainData,
    capabilities,
    // set integratorID to undefined if it's falsey
    // to avoid sending it in the response
    integratorId: integratorId || undefined,
  }

  const { fullPath: self } = getSelfLink(
    ctx,
    {
      id: companyId,
      selfPathToUse,
    },
  )

  return {
    id: companyId,
    type: 'company',
    attributes,
    links: {
      self,
    },
  }
}

export function assembleCollectionResponse(
  ctx,
  companies,
  {
    pageSize,
    pageBefore,
    pageAfter,
    lastPage,
  },
) {
  const {
    fullPath: self,
    noQuery: selfNoQuery,
  } = getSelfLink(
    ctx,
    {
      pageSize,
      pageBefore,
      pageAfter,
    },
  )

  const retVal = {
    data: companies.map(company => serializeCompany(ctx, company)),
    links: {
      self,
    },
  }

  // Add next and prev links if it was a paginated request. If no companies are
  // returned from the DB, then the links will be null
  if (pageSize) {
    retVal.links.next = companies.length
      ? `${selfNoQuery}?page[size]=${pageSize}&page[after]=${companies.at(-1).companyId}`
      : null
    retVal.links.prev = companies.length
      ? `${selfNoQuery}?page[size]=${pageSize}&page[before]=${companies[0].companyId}`
      : null

    // Forward pagination will always have a "prev" link but will not have
    // "next" if this is the last page.
    if (pageAfter && lastPage) {
      retVal.links.next = null
    }
    // Backward pagination will always have a "next" link but will not have
    // "prev" if this is the last page.
    if (pageBefore && lastPage) {
      retVal.links.prev = null
    }
    // Neither pageBefore nor pageAfter are set - initial page request. This
    // will never have a "prev" link, but will have "next" if not the last page.
    if (!pageBefore && !pageAfter) {
      retVal.links.prev = null
      if (lastPage) {
        retVal.links.next = null
      }
    }
  }

  return retVal
}

export function assembleResponse(
  ctx,
  {
    companyId,
    tokenId,
    token,
    displayName,
    capabilities,
    daysToRetainData,
    integratorId,
  },
  selfPathToUse = null,
) {
  const data = serializeCompany(
    ctx,
    {
      companyId,
      displayName,
      capabilities,
      daysToRetainData,
      integratorId,
    },
    selfPathToUse,
  )

  const success = {
    data,
  }

  // If there is a token and tokenId, add them as a relationship.
  if (tokenId && token) {
    success.data.relationships = {
      token: {
        data: {
          type: 'token',
          id: tokenId,
        },
      },
    }

    success.included = [{
      type: 'token',
      id: tokenId,
      attributes: {
        token,
      },
    }]
  }

  return success
}
