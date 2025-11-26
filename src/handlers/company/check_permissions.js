import { services } from '../../services/index.js'

const companyIncludesPermissionsSetQuery = /* SQL */ `
  SELECT NOT EXISTS (
    SELECT
      UNNEST(ARRAY[ :permissionList ])
    EXCEPT
    SELECT
      permission_id
    FROM
      user_companies_permissions
    WHERE
      user_id = :userId
  ) "hasAll"
`

const companyHasAll = (userId, permissionList) => {
  const { DB: sql } = services
  return sql.query(companyIncludesPermissionsSetQuery, {
    plain: true,
    replacements: {
      userId,
      permissionList,
    },
  })
    .then(({ hasAll }) => hasAll)
}

export const companyPermission = {
  hasAll: companyHasAll,
}
