import fetch from 'node-fetch'

export const ping = baseUrl =>
  fetch(`${baseUrl}/ping`)
