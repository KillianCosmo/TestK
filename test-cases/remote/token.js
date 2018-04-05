import moment from 'moment'

import {
  assertString,
  assertDateString
} from '../../../lib/common/test'

import {
  timeout
} from '../../../lib/common/util'

import {
  jwtSign
} from '../../../lib/common/token'

import {
  setupTenant,
  getTenantInfo
} from '../../client/tenant'

import {
  setupApp,
  getAppInfo
} from '../../client/app'

import {
  getTokenInfo,
  createRootToken,
  revokeAccessToken,
  refreshAccessToken
} from '../../client/token'

export const tokenTest = async (t, config) => {
  const { apiBaseUrl, rootToken } = config

  {
    t.comment('GET /api/token with root token should return token info with scope root')

    const response = await getTokenInfo(apiBaseUrl, rootToken)
    t.ok(response.ok)

    const tokenInfo = (await response.json()).token

    assertString(t, tokenInfo.token_id)
    t.equals(tokenInfo.scope, 'root')
    assertDateString(t, tokenInfo.expiry)
  }
  {
    t.comment('GET /api/token with invalid token should return 401 error')

    const response = await getTokenInfo(apiBaseUrl, 'invalid')
    t.equals(response.status, 401)
  }
  {
    t.comment('GET /api/token with invalid JWT token should return 401 error')

    const jwtToken = await jwtSign({}, 'invalid', {
      algorithm: 'HS256'
    })

    const response = await getTokenInfo(apiBaseUrl, jwtToken)
    t.equals(response.status, 401)
  }
  {
    t.comment('GET /api/token with invalid algorithm should return 401 error')

    const jwtToken = await jwtSign({}, 'invalid', {
      algorithm: 'none'
    })

    const response = await getTokenInfo(apiBaseUrl, jwtToken)
    t.equals(response.status, 401)
  }
  {
    t.comment('POST /api/root/token with root token should create new root token')

    const response1 = await createRootToken(apiBaseUrl, rootToken)
    t.ok(response1.ok)

    const tokenInfo = (await response1.json()).token
    const accessToken = tokenInfo.access_token

    assertString(t, accessToken)
    t.notEquals(accessToken, rootToken)

    const response2 = await getTokenInfo(apiBaseUrl, accessToken)
    t.ok(response2.ok)

    const tokenInfo2 = (await response2.json()).token

    assertString(t, tokenInfo2.token_id)
    t.equals(tokenInfo2.scope, 'root')
    assertDateString(t, tokenInfo2.expiry)
  }
  {
    t.comment('POST /api/root/token with validity should expire after given validity')

    const response = await createRootToken(apiBaseUrl, rootToken, {
      token_validity: 1000
    })

    t.ok(response.ok)

    const tokenInfo = (await response.json()).token
    const accessToken = tokenInfo.access_token

    assertString(t, accessToken)

    {
      const response = await getTokenInfo(apiBaseUrl, accessToken)
      t.ok(response.ok)
    }
    await timeout(1500)
    {
      const response = await getTokenInfo(apiBaseUrl, accessToken)
      t.equals(response.status, 401)
    }
  }
  {
    t.comment('POST /api/root/token with negative validity should expire immediately')

    const response = await createRootToken(apiBaseUrl, rootToken, {
      token_validity: -1
    })

    t.ok(response.ok)

    const tokenInfo = (await response.json()).token
    const accessToken = tokenInfo.access_token

    assertString(t, accessToken)

    {
      const response = await getTokenInfo(apiBaseUrl, accessToken)
      t.equals(response.status, 401)
    }
  }
  {
    t.comment('refresh root token should revoke old token and get back new token')

    let accessToken, refreshToken
    {
      const response = await createRootToken(apiBaseUrl, rootToken)

      t.ok(response.ok)

      const tokenInfo = (await response.json()).token
      accessToken = tokenInfo.access_token
      refreshToken = tokenInfo.refresh_token
    }

    let accessToken2
    {
      const response = await refreshAccessToken(apiBaseUrl, accessToken, refreshToken)
      t.ok(response.ok)

      const tokenInfo = (await response.json()).token

      accessToken2 = tokenInfo.access_token
      t.notEquals(accessToken2, accessToken)
      t.ok(moment(tokenInfo.expiry).isAfter(moment()))
    }
    {
      const response = await getTokenInfo(apiBaseUrl, accessToken)
      t.equals(response.status, 401)
    }
    {
      const response = await getTokenInfo(apiBaseUrl, accessToken2)
      t.ok(response.ok)
    }
  }
  {
    t.comment('refresh tenant token should revoke old token and get back new token')

    const {
      tenantId,
      tenantTokenInfo
    } = await setupTenant(apiBaseUrl, rootToken)

    const accessToken = tenantTokenInfo.access_token
    const refreshToken = tenantTokenInfo.refresh_token

    {
      const response = await getTenantInfo(apiBaseUrl, accessToken, tenantId)
      t.ok(response.ok)
    }

    let accessToken2
    {
      const response = await refreshAccessToken(apiBaseUrl, accessToken, refreshToken)
      t.ok(response.ok)

      const tokenInfo = (await response.json()).token

      accessToken2 = tokenInfo.access_token
      t.notEquals(accessToken2, accessToken)
      t.ok(moment(tokenInfo.expiry).isAfter(moment()))
    }
    {
      const response = await getTenantInfo(apiBaseUrl, accessToken, tenantId)
      t.equals(response.status, 401)
    }
    {
      const response = await getTenantInfo(apiBaseUrl, accessToken, tenantId)
      t.equals(response.status, 401)
    }
    {
      const response = await getTenantInfo(apiBaseUrl, accessToken2, tenantId)
      t.ok(response.ok)
    }
    {
      const response = await refreshAccessToken(apiBaseUrl, accessToken, refreshToken)
      t.equals(response.status, 401)
    }
  }
  {
    t.comment('refresh token with invalid JWT should return status 400')

    const {
      tenantTokenInfo
    } = await setupTenant(apiBaseUrl, rootToken)

    const accessToken = tenantTokenInfo.access_token

    const response = await refreshAccessToken(apiBaseUrl, accessToken, 'invalid jwt')
    t.equals(response.status, 400)
  }
  {
    t.comment('revoke tenant token should revoke old token and disallow refreshing it')

    const {
      tenantId,
      tenantTokenInfo
    } = await setupTenant(apiBaseUrl, rootToken)

    const accessToken = tenantTokenInfo.access_token
    const refreshToken = tenantTokenInfo.refresh_token

    {
      const response = await revokeAccessToken(apiBaseUrl, accessToken)
      t.ok(response.ok)

      const result = await response.json()
      t.equals(result.revoked, true)
    }
    {
      const response = await getTenantInfo(apiBaseUrl, accessToken, tenantId)
      t.equals(response.status, 401)
    }
    {
      const response = await refreshAccessToken(apiBaseUrl, accessToken, refreshToken)
      t.equals(response.status, 401)
    }
  }
  {
    t.comment('refresh app token should revoke old token and get back new token')

    const {
      tenantId,
      tenantToken
    } = await setupTenant(apiBaseUrl, rootToken)

    const {
      appId,
      appTokenInfo
    } = await setupApp(apiBaseUrl, tenantToken, tenantId)

    const accessToken = appTokenInfo.access_token
    const refreshToken = appTokenInfo.refresh_token

    {
      const response = await getAppInfo(apiBaseUrl, accessToken, appId)
      t.ok(response.ok)
    }

    let accessToken2
    {
      const response = await refreshAccessToken(apiBaseUrl, accessToken, refreshToken)
      t.ok(response.ok)

      const tokenInfo = (await response.json()).token

      accessToken2 = tokenInfo.access_token
      t.notEquals(accessToken2, accessToken)
      t.ok(moment(tokenInfo.expiry).isAfter(moment()))
    }
    {
      const response = await getAppInfo(apiBaseUrl, accessToken, appId)
      t.equals(response.status, 401)
    }
    {
      const response = await getAppInfo(apiBaseUrl, accessToken, appId)
      t.equals(response.status, 401)
    }
    {
      const response = await getAppInfo(apiBaseUrl, accessToken2, appId)
      t.ok(response.ok)
    }
    {
      const response = await refreshAccessToken(apiBaseUrl, accessToken, refreshToken)
      t.equals(response.status, 401)
    }
  }
  {
    t.comment('refresh app token with validity should have refreshed token expired after given validity')

    const {
      tenantId,
      tenantToken
    } = await setupTenant(apiBaseUrl, rootToken)

    const {
      appId,
      appTokenInfo
    } = await setupApp(apiBaseUrl, tenantToken, tenantId)

    const accessToken = appTokenInfo.access_token
    const refreshToken = appTokenInfo.refresh_token

    {
      const response = await getAppInfo(apiBaseUrl, accessToken, appId)
      t.ok(response.ok)
    }

    let accessToken2
    {
      const response = await refreshAccessToken(apiBaseUrl, accessToken,
        refreshToken, 1000)
      t.ok(response.ok)

      const tokenInfo = (await response.json()).token

      accessToken2 = tokenInfo.access_token
      t.notEquals(accessToken2, accessToken)
      t.ok(moment(tokenInfo.expiry).isAfter(moment()))
    }

    {
      const response = await getAppInfo(apiBaseUrl, accessToken2, appId)
      t.ok(response.ok)
    }

    await timeout(1500)

    {
      const response = await getAppInfo(apiBaseUrl, accessToken2, appId)
      t.equals(response.status, 401)
    }
  }
}
