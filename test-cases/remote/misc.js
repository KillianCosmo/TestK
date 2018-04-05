import {
  asyncTest,
  assertDateString
} from '../../../lib/common/test'

import { ping } from '../../client/misc'

export const miscTest = (t, config) => {
  const { apiBaseUrl } = config

  asyncTest(
    t,
    '/api/ping should return JSON response with pong field',
    async t => {
      const response = await ping(apiBaseUrl)
      t.ok(response.ok)
      const json = await response.json()

      const { pong } = json
      t.ok(pong)
      assertDateString(t, pong)
    })
}
