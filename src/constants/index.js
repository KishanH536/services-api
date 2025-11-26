const mirrorObjectFromList = list => Object.fromEntries(
  list.map(name => [name, name]),
)

// dump from the DB: select id from permissions; (retrieved Oct 2023)
const allPermissions = mirrorObjectFromList([
  'MEMBER_USER',
  'ADMIN_USER',
  'SUPER_USER',
  'CREATE_COMPANY',
])

// dump from the DB: select name from company_types; (retrieved Oct 2023)
const companyTypes = mirrorObjectFromList([
  'DEMO',
  'STANDARD',
  'TEST',
])

// dump from the DB: select name from products; (retrieved Oct 2023)
const products = mirrorObjectFromList([
  'CALIPSA',
  'PLATFORM',
])

/*
 * although the DB schema suggests every permission is allowed in
 * these tables
 *   `user_projects_permissions`
 *   `user_sites_permissions`
 *   `user_companies_permissions`
 * the data in production suggests that the permissions are
 * used more like the struct below
 */
const permissions = {
  company: {
    createCompany: allPermissions.CREATE_COMPANY,
    admin: allPermissions.ADMIN_USER,
    super: allPermissions.SUPER_USER,
    normal: allPermissions.MEMBER_USER,
  },
}

const permissionToUserTypeMap = new Map([
  [allPermissions.SUPER_USER, 'super-admin'],
  [allPermissions.ADMIN_USER, 'admin'],
  [allPermissions.MEMBER_USER, 'member'],
])

const mimes = {
  jsonApi: 'application/vnd.api+json',
}

const objectTypes = mirrorObjectFromList([
  'person',
  'vehicle',
  'mixed',
])

const detectionTypeNames = {
  count: 'countDetection',
  crowd_forming: 'crowdFormingDetection',
  gun: 'gunDetection',
  loitering: 'loiteringDetection',
  watch_list: 'watchListDetection',
  face: 'faceDetection',
}

// TODO: come up with a better way to do this
const analyticsFeaturesToId = new Map([
  ['vehicleAnalysis', 3],
  ['personAnalysis', 4],
  ['sceneClassification', 6],
  ['multipleRiskAnalysis', 7],
])
const analyticsIdsToFeatures = new Map([
  [3, 'vehicleAnalysis'],
  [4, 'personAnalysis'],
  [6, 'sceneClassification'],
  [7, 'multipleRiskAnalysis'],
])

const faceChipsEmbeddingsVersions = {
  defaults: {
    chips: '5',
    fullFrame: '6',
  },
  allowed: ['5', '6'],
}

export {
  permissions,
  permissionToUserTypeMap,
  companyTypes,
  products,
  mimes,
  objectTypes,
  detectionTypeNames,
  analyticsFeaturesToId,
  analyticsIdsToFeatures,
  faceChipsEmbeddingsVersions,
}
