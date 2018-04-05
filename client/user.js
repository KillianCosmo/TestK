import fetch from 'node-fetch'

export const registerUser = async (baseUrl, token, body) => {
  return fetch(
    `${baseUrl}/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
}

export const login = async (baseUrl, username, password) => {
  return fetch(
    `${baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password
      })
    })
}
