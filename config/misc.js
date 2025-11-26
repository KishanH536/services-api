import {
  normalizePath,
} from './utils.js'

// relative or absolute URL which is used for creating links in response documents
const MY_BASE_URL_FOR_LINKS = normalizePath(process.env.MY_BASE_URL_FOR_LINKS)

const {
  TZ: DEFAULT_TZ = 'Europe/London',
  VALIDATE_RESPONSES,
} = process.env

export {
  MY_BASE_URL_FOR_LINKS,
  DEFAULT_TZ,
  VALIDATE_RESPONSES,
}
