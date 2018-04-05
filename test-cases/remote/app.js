import {
  assertString
} from '../../../lib/common/test'

import {
  setupTenant,
  getTenantInfo,
  disableTenant
} from '../../client/tenant'

import {
  setupApp,
  listApps,
  createApp,
  getAppInfo,
  createAppToken,
  getCurrentAppInfo
} from '../../client/app'

export const appTest = async (t, config) => {
  const { apiBaseUrl, rootToken } = config

  const {
    tenantId: tenantId1,
    tenantToken: tenantToken1
  } = await setupTenant(apiBaseUrl, rootToken)

  let appId1
  {
    t.comment('PUT /api/tenants/{tenantId}/app should create new app')
    const response = await createApp(apiBaseUrl, tenantToken1, tenantId1, 'Talky')
    t.ok(response.ok)

    const appInfo = (await response.json()).app

    t.equals(appInfo.app_name, 'Talky')
    t.notOk(appInfo.app_pk)

    appId1 = appInfo.app_id
    assertString(t, appId1)
  }
  {
    t.comment('create app with invalid app name should return error 400')

    const response = await createApp(apiBaseUrl, tenantToken1, tenantId1, 42)
    t.equals(response.status, 400)
  }
  {
    t.comment('create app with app name too long should return error 400')

    const response = await createApp(
      apiBaseUrl, tenantToken1, tenantId1, 'a'.repeat(256))

    t.equals(response.status, 400)
  }

  let appToken1
  {
    const response = await createAppToken(apiBaseUrl, tenantToken1, appId1)
    t.ok(response.ok)

    const tokenInfo1 = (await response.json()).token
    t.equals(tokenInfo1.scope, 'app')

    appToken1 = tokenInfo1.access_token
    assertString(t, appToken1)
  }
  {
    t.comment('tenant should be able to list apps')

    const response = await listApps(apiBaseUrl, tenantToken1, tenantId1)
    t.ok(response.ok)

    const result = await response.json()
    t.equals(result.tenant_id, tenantId1)

    const { apps } = result
    t.ok(Array.isArray(apps))

    const appInfo = apps.find(app => {
      return app.app_id === appId1 && app.app_name === 'Talky'
    })

    t.ok(appInfo)
    t.notOk(appInfo.app_pk)
  }
  {
    t.comment('apps should not be able to list apps')
    const response = await listApps(apiBaseUrl, appToken1, tenantId1)
    t.equals(response.status, 401)
  }
  {
    t.comment('GET /api/apps/{appId} should return app info with valid app token')

    const response = await getAppInfo(apiBaseUrl, appToken1, appId1)
    const appInfo = (await response.json()).app

    t.notOk(appInfo.app_pk)
    t.equals(appInfo.app_id, appId1)
    t.equals(appInfo.app_name, 'Talky')
    t.equals(appInfo.tenant_id, tenantId1)
  }
  {
    t.comment('GET /api/apps/{appId} should return app info with valid tenant token')

    const response = await getAppInfo(apiBaseUrl, tenantToken1, appId1)
    const appInfo = (await response.json()).app

    t.equals(appInfo.app_id, appId1)
    t.equals(appInfo.app_name, 'Talky')
  }
  {
    t.comment('GET /api/app should return current app info')

    const response = await getCurrentAppInfo(apiBaseUrl, appToken1)
    const appInfo = (await response.json()).app

    t.notOk(appInfo.app_pk)
    t.equals(appInfo.app_id, appId1)
    t.equals(appInfo.app_name, 'Talky')
    t.equals(appInfo.tenant_id, tenantId1)
  }
  {
    t.comment('GET /api/apps/{appId} with invalid UUID should return error 400')

    const response = await getAppInfo(apiBaseUrl, tenantToken1, 'blah')
    t.equals(response.status, 400)
  }
  {
    t.comment('Different app should not able to access other app info')
    const response1 = await createApp(apiBaseUrl, tenantToken1, tenantId1, 'Chatty')
    t.ok(response1.ok)

    const appId2 = (await response1.json()).app.app_id

    const response2 = await createAppToken(apiBaseUrl, tenantToken1, appId2)
    t.ok(response2.ok)

    const appToken2 = (await response2.json()).token.access_token

    const response3 = await getAppInfo(apiBaseUrl, appToken2, appId1)
    t.equals(response3.status, 401)

    const response4 = await getAppInfo(apiBaseUrl, appToken1, appId2)
    t.equals(response4.status, 401)
  }
  {
    t.comment('Multiple tenants test')

    const {
      tenantId: tenantId2,
      tenantToken: tenantToken2
    } = await setupTenant(apiBaseUrl, rootToken)

    {
      t.comment(`tenants should not be able to list other tenant's apps`)
      const response = await listApps(apiBaseUrl, tenantToken2, tenantId1)
      t.equals(response.status, 401)
    }
    {
      t.comment('tenants should not able to create apps for other tenants')

      const response1 = await createApp(apiBaseUrl, tenantToken2, tenantId1, 'Chatty')
      t.equals(response1.status, 401)

      const response2 = await createApp(apiBaseUrl, tenantToken1, tenantId2, 'Chatty')
      t.equals(response2.status, 401)
    }
    {
      t.comment('Different tenant should not able to access other app info')

      {
        const response = await getAppInfo(apiBaseUrl, tenantToken2, appId1)
        t.equals(response.status, 401)
      }

      let appId2
      {
        const response = await createApp(apiBaseUrl, tenantToken2, tenantId2, 'Chatty')
        t.ok(response.ok)

        appId2 = (await response.json()).app.app_id
      }
      {
        const response = await createAppToken(apiBaseUrl, tenantToken1, appId2)
        t.equals(response.status, 401)
      }
      let appToken2
      {
        const response = await createAppToken(apiBaseUrl, tenantToken2, appId2)
        t.ok(response.ok)

        appToken2 = (await response.json()).token.access_token
      }
      {
        const response = await getAppInfo(apiBaseUrl, appToken2, appId1)
        t.equals(response.status, 401)
      }
      {
        const response = await getAppInfo(apiBaseUrl, appToken1, appId2)
        t.equals(response.status, 401)
      }
    }
  }
  {
    t.comment('disabled tenant should not be allowed to access tenant or app')

    const {
      tenantId, tenantToken
    } = await setupTenant(apiBaseUrl, rootToken)

    const {
      appId, appToken
    } = await setupApp(apiBaseUrl, tenantToken, tenantId)

    const response1 = await disableTenant(apiBaseUrl, rootToken, tenantId, true)
    t.ok(response1.ok)

    const response2 = await getTenantInfo(apiBaseUrl, tenantToken, tenantId)
    t.equals(response2.status, 403)

    const response3 = await getAppInfo(apiBaseUrl, tenantToken, appId)
    t.equals(response3.status, 403)

    const response4 = await getAppInfo(apiBaseUrl, appToken, appId)
    t.equals(response4.status, 403)

    const response5 = await getTenantInfo(apiBaseUrl, rootToken, tenantId)
    t.ok(response5.ok)

    const response6 = await disableTenant(apiBaseUrl, rootToken, tenantId, false)
    t.ok(response6.ok)

    const response7 = await getTenantInfo(apiBaseUrl, tenantToken, tenantId)
    t.ok(response7.ok)

    const response8 = await getAppInfo(apiBaseUrl, tenantToken, appId)
    t.ok(response8.ok)

    const response9 = await getAppInfo(apiBaseUrl, appToken, appId)
    t.ok(response9.ok)
  }
}
