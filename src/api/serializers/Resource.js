import { Serializer as JSONAPISerializer } from 'jsonapi-serializer'

import { MY_BASE_URL_FOR_LINKS as myBaseUrl } from '../../../config/misc.js'
import { API_SERVER_BASE_URL_FOR_LINKS as apiServerBaseUrl } from '../../../config/api_server.js'

export default class Resource {
  constructor() {
    this.myBaseUrl = myBaseUrl
    this.apiServerBaseUrl = apiServerBaseUrl
    this.opts = {
      pluralizeType: false,
      keyForAttribute: 'camelCase',
    }
  }

  serialize(type, data) {
    return new JSONAPISerializer(type, this.opts).serialize(data)
  }
}
