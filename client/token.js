import fetch from 'node-fetch'

export const getTokenInfo = async (baseUrl, token) => {
  return fetch(
    `${baseUrl}/token`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
}

export const createRootToken = async (baseUrl, token, payload = {}) => {
  return fetch(
    `${baseUrl}/token/root`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
}

export const refreshAccessToken = async (baseUrl, token, refreshToken, validity) => {
  return fetch(
    `${baseUrl}/token/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
        token_validity: validity
      })
    })
}

export const revokeAccessToken = async (baseUrl, token) => {
  return fetch(
    `${baseUrl}/token/revoke`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
}
