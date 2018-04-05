import fetch from 'node-fetch'

export const createRoom = async (baseUrl, token, appId, participantCount, region) =>
  fetch(
    `${baseUrl}/apps/${appId}/rooms`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        participant_count: participantCount,
        region
      })
    })

export const getRoomInfo = async (baseUrl, token, roomId) =>
  fetch(
    `${baseUrl}/rooms/${roomId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

export const listRooms = async (baseUrl, token, appId) =>
  fetch(
    `${baseUrl}/apps/${appId}/rooms`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

export const getRoomConfig = async (baseUrl, token, roomId) =>
  fetch(
    `${baseUrl}/rooms/${roomId}/config`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

export const getRoomDuration = async (baseUrl, token, roomId) =>
  fetch(
    `${baseUrl}/rooms/${roomId}/duration`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

export const getRoomActivities = async (baseUrl, token, roomId) =>
  fetch(
    `${baseUrl}/rooms/${roomId}/activities`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

export const closeRoom = async (baseUrl, token, roomId) =>
  fetch(
    `${baseUrl}/rooms/${roomId}/close`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

export const getXmppTunnel = async (baseUrl, token, roomId) =>
  fetch(`${baseUrl}/tunnel/xmpp?room=${roomId}&token=${token}`)

export const setupRoom = async (baseUrl, appToken, appId) => {
  const response = await createRoom(baseUrl, appToken, appId, 2)

  if (!response.ok) {
    throw new Error(`Unexpected ${response.status} response when creating room`)
  }

  const roomResult = await response.json()
  const roomInfo = roomResult.room
  const roomId = roomInfo.room_id

  const { participants } = roomResult
  const participantInfo = participants[0]
  const participantId = participantInfo.participant_id

  const roomToken = participantInfo.token.access_token

  return {
    roomId,
    roomToken,
    roomInfo,
    participants,
    participantId,
    participantInfo
  }
}
