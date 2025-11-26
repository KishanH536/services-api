const { JWT_SECRET } = process.env

// TODO: The iss URI default value will need to be modified at some point to
// refer to their prod instance.
const UNIFIED_ID_ISS = process.env.UNIFIED_ID_ISS || 'https://idmmaster.imw.motorolasolutions.com:443'
const UNIFIED_ID_JWKS_URL = process.env.UNIFIED_ID_JWKS_URL || 'https://idmmaster.imw.motorolasolutions.com/ext/oauth/jwks'

export {
  JWT_SECRET as jwtSecret,
  UNIFIED_ID_JWKS_URL as unifiedIdJwksUrl,
  UNIFIED_ID_ISS as unifiedIdIss,
}
