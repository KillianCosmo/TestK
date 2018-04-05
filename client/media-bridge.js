import fetch from 'node-fetch'

export const listRegions = (baseUrl, token) =>
  fetch(`${baseUrl}/regions`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

export const createRegion = (baseUrl, token, regionId) =>
  fetch(`${baseUrl}/regions/${regionId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

export const updateRegion = (baseUrl, token, regionId, payload) =>
  fetch(`${baseUrl}/regions/${regionId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

export const getMediaBridgeInfo = (baseUrl, token, mediaBridgeId) =>
  fetch(`${baseUrl}/media-bridges/${mediaBridgeId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

export const getMediaBridgeHealth = (baseUrl, token, mediaBridgeId) =>
  fetch(`${baseUrl}/media-bridges/${mediaBridgeId}/health`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

export const getMediaBridgeStats = (baseUrl, token, mediaBridgeId) =>
  fetch(`${baseUrl}/media-bridges/${mediaBridgeId}/stats`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

export const getMediaBridgeRank = (baseUrl, token, mediaBridgeId) =>
  fetch(`${baseUrl}/media-bridges/${mediaBridgeId}/rank`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

export const getMediaBridgeFromRoom = (baseUrl, token, roomId) =>
  fetch(`${baseUrl}/rooms/${roomId}/media-bridge`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

export const listMediaBridges = (baseUrl, token, region) =>
  fetch(`${baseUrl}/regions/${region}/media-bridges`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

export const createMediaBridge = (baseUrl, token, region, networkHost,
  controllerPort, websocketPort) =>
  fetch(`${baseUrl}/regions/${region}/media-bridges`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      network_host: networkHost,
      controller_port: controllerPort,
      websocket_port: websocketPort
    })
  })

export const updateMediaBridge = (baseUrl, token, mediaBridgeId, payload) =>
  fetch(`${baseUrl}/media-bridges/${mediaBridgeId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
