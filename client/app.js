import fetch from 'node-fetch'

export const createApp = (baseUrl, token, tenantId, appName) =>
  fetch(
    `${baseUrl}/tenants/${tenantId}/apps`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_name: appName
      })
    })

export const getAppInfo = (baseUrl, token, appId) =>
  fetch(
    `${baseUrl}/apps/${appId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

export const getCurrentAppInfo = (baseUrl, token) =>
  fetch(
    `${baseUrl}/app`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

export const createAppToken = (baseUrl, token, appId) =>
  fetch(
    `${baseUrl}/apps/${appId}/tokens`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

export const listApps = (baseUrl, token, tenantId) =>
  fetch(
    `${baseUrl}/tenants/${tenantId}/apps`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

export const disableApp = async (baseUrl, token, appId, disabled) => {
  return fetch(
    `${baseUrl}/apps/${appId}/disable`, {
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

export const setupApp = async (baseUrl, tenantToken, tenantId) => {
  const response1 = await createApp(baseUrl, tenantToken, tenantId, 'app')
  if (!response1.ok) {
    throw new Error(`Unexpected ${response1.status} response when creating app`)
  }

  const appId = (await response1.json()).app.app_id

  const response2 = await createAppToken(baseUrl, tenantToken, appId)
  if (!response2.ok) {
    throw new Error(`Unexpected ${response2.status} response when creating app token`)
  }

  const tokenInfo = (await response2.json()).token

  return {
    appId,
    appToken: tokenInfo.access_token,
    appTokenInfo: tokenInfo
  }
}
