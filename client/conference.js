import fetch from 'node-fetch'

export const createConference = async (baseUrl, roomId) =>
  fetch(`${baseUrl}/rooms/${roomId}/conferences`, {
    method: 'POST'
  })

export const getOngoingConference = async (baseUrl, roomId) =>
  fetch(`${baseUrl}/rooms/${roomId}/ongoing-conference`)

export const listConferences = async (baseUrl, token, roomId) =>
  fetch(`${baseUrl}/rooms/${roomId}/conferences`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

export const getConferenceInfo = async (baseUrl, conferenceId) =>
  fetch(`${baseUrl}/conferences/${conferenceId}`)

export const getReservationInfo = async (baseUrl, reservationId) =>
  fetch(`${baseUrl}/reservations/${reservationId}`)

export const endConference = async (baseUrl, conferenceId) =>
  fetch(`${baseUrl}/conferences/${conferenceId}/end`, {
    method: 'POST'
  })
