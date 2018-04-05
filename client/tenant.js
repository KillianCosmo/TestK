import fetch from 'node-fetch'

export const createTenant = async (baseUrl, token, tenantName) => {
  return fetch(
    `${baseUrl}/tenants`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenant_name: tenantName
      })
    })
}

export const getTenantInfo = async (baseUrl, token, tenantId) => {
  return fetch(
    `${baseUrl}/tenants/${tenantId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
}

export const listTenants = async (baseUrl, token) => {
  return fetch(
    `${baseUrl}/tenants`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
}

export const createTenantToken = async (baseUrl, token, tenantId) => {
  return fetch(
    `${baseUrl}/tenants/${tenantId}/tokens`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
}

export const disableTenant = async (baseUrl, token, tenantId, disabled) => {
  return fetch(
    `${baseUrl}/tenants/${tenantId}/disable`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        disabled
      })
    })
}

export const setupTenant = async (baseUrl, rootToken) => {
  const response1 = await createTenant(baseUrl, rootToken, 'tenant')

  if (!response1.ok) {
    throw new Error(`Unexpected ${response1.status} response when creating room`)
  }

  const tenantId = (await response1.json()).tenant.tenant_id

  const response2 = await createTenantToken(baseUrl, rootToken, tenantId)

  if (!response2.ok) {
    throw new Error(`Unexpected ${response2.status} response when creating room`)
  }

  const tokenInfo = (await response2.json()).token

  return {
    tenantId,
    tenantToken: tokenInfo.access_token,
    tenantTokenInfo: tokenInfo
  }
}
