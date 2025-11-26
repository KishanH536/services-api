import {
  API_SERVER_BASE_URL_FOR_LINKS as apiServerBaseUrl,
} from '../../../config/api_server.js'

/**
 * Transforms a watchListDetection (which only has ID in it) to an equivalent Services API
 * resource representation object.
 * @param {*} viewId the Calipsa ID of the associated view
 * @param {*} rule the advanced rule
 * @param {*} item the watchlist item to be transformed
 * @returns {Object} a WatchListItemResource representation of this watchlist item
 */
export const toWatchListItemResource = (viewId, ruleId, item) => ({
  id: item.id,
  type: 'watchlist-item',
  links: {
    // The value of this URL was discovered while exploring how this works in api-server
    'http://calipsa.io/relation/current-image': `${apiServerBaseUrl}/view/watchlist/image?path=${viewId}/${ruleId}/${item.id}.jpg`,
  },
})
