// Configuration for connecting with the backend API server (frontend-ng) and publicizing links
const {
  API_SERVER_BASE_URL_FOR_LINKS,
} = process.env

const apiServerBaseUrlForLinks = API_SERVER_BASE_URL_FOR_LINKS || ''

export {
  apiServerBaseUrlForLinks as API_SERVER_BASE_URL_FOR_LINKS,
}
