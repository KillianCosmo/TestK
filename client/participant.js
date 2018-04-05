import fetch from 'node-fetch'

export const getParticipantInfo = (baseUrl, token, participantId) =>
  fetch(`${baseUrl}/participants/${participantId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

export const listParticipants = (baseUrl, token, roomId) =>
  fetch(`${baseUrl}/rooms/${roomId}/participants`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

export const createParticipant = async (baseUrl, token, roomId) =>
  fetch(
    `${baseUrl}/rooms/${roomId}/participants`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

export const createParticipantToken = async (baseUrl, token, participantId) =>
  fetch(
    `${baseUrl}/participants/${participantId}/tokens`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
