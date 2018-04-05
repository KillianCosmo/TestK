import {
  randomId,
  assertString
} from '../../../lib/common/test'

import {
  getTokenInfo
} from '../../client/token'

import {
  listTenants,
  createTenant,
  getTenantInfo,
  createTenantToken
} from '../../client/tenant'

import {
  login,
  registerUser
} from '../../client/user'

export const tenantTest = async (t, config) => {
  const { apiBaseUrl, rootToken } = config

  {
    t.comment('PUT /api/tenant should create new tenant')

    let tenantId
    {
      const response = await createTenant(apiBaseUrl, rootToken, 'Acme')
      t.ok(response.ok)

      const tenantInfo = (await response.json()).tenant

      t.notOk(tenantInfo.tenant_pk)
      t.equals(tenantInfo.tenant_name, 'Acme')

      tenantId = tenantInfo.tenant_id
      assertString(t, tenantId)
    }
    {
      const response = await getTenantInfo(apiBaseUrl, rootToken, tenantId)
      t.ok(response.ok)

      const tenantInfo = (await response.json()).tenant

      t.notOk(tenantInfo.tenant_pk)
      t.equals(tenantInfo.tenant_id, tenantId)
      t.equals(tenantInfo.tenant_name, 'Acme')
    }
    {
      const response = await listTenants(apiBaseUrl, rootToken)
      t.ok(response.ok)

      const { tenants } = await response.json()
      t.ok(Array.isArray(tenants))
      const tenantInfo = tenants.find(tenant => {
        return tenant.tenant_id === tenantId &&
          tenant.tenant_name === 'Acme'
      })

      t.ok(tenantInfo)
      t.notOk(tenantInfo.tenant_pk)
    }
  }
  {
    t.comment('Tenant token test')

    let tenantId
    {
      const response = await createTenant(apiBaseUrl, rootToken, 'Acme')
      t.ok(response.ok)

      tenantId = (await response.json()).tenant.tenant_id
    }

    let tenantToken1
    {
      const response = await createTenantToken(apiBaseUrl, rootToken, tenantId)
      t.ok(response.ok)

      const tokenInfo = (await response.json()).token
      t.ok(tokenInfo)

      tenantToken1 = tokenInfo.access_token
      assertString(t, tenantToken1)
    }
    {
      const response = await getTenantInfo(apiBaseUrl, tenantToken1, tenantId)
      t.ok(response.ok)

      const tenantInfo = (await response.json()).tenant
      t.equals(tenantInfo.tenant_id, tenantId)
      t.equals(tenantInfo.tenant_name, 'Acme')
    }

    t.comment('Tenant token should not able to access root APIs')
    {
      const response = await createTenant(apiBaseUrl, tenantToken1, 'Ajax')
      t.equals(response.status, 401)
    }
    {
      const response = await listTenants(apiBaseUrl, tenantToken1)
      t.equals(response.status, 401)
    }

    {
      t.comment('Tenant token should not able to access other tenant info')

      let tenantId2
      {
        const response = await createTenant(apiBaseUrl, rootToken, 'Ajax')
        t.ok(response.ok)

        tenantId2 = (await response.json()).tenant.tenant_id
        t.notEquals(tenantId2, tenantId)
      }
      {
        const response = await getTenantInfo(apiBaseUrl, tenantToken1, tenantId2)
        t.equals(response.status, 401)
      }
    }
  }
  {
    t.comment('Tenant user test')

    let tenantId
    {
      const response = await createTenant(apiBaseUrl, rootToken, 'Acme')
      t.ok(response.ok)

      tenantId = (await response.json()).tenant.tenant_id
    }

    const username = await randomId()
    const password = await randomId()

    {
      const response = await registerUser(apiBaseUrl, rootToken, {
        username,
        password,
        scope: 'tenant',
        tenant_id: tenantId
      })

      t.ok(response.ok)

      const { user } = await response.json()
      assertString(t, user.user_id)
    }

    let tenantToken
    {
      const response = await login(apiBaseUrl, username, password)
      t.ok(response.ok)

      const tokenInfo = (await response.json()).token
      tenantToken = tokenInfo.access_token

      assertString(t, tenantToken)
    }
    {
      const response = await getTokenInfo(apiBaseUrl, tenantToken)
      t.ok(response.ok)

      const tokenInfo = (await response.json()).token

      assertString(t, tokenInfo.token_id)
      t.equals(tokenInfo.scope, 'tenant')
    }
    {
      t.comment('login with invalid password should fail')

      const response = await login(apiBaseUrl, username, 'invalid')
      t.equals(response.status, 401)
    }
  }
}
