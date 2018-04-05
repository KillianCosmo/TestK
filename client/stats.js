import fetch from 'node-fetch'

export const getRoomActivitiesByApp = (baseUrl, token, appId, startTime, endTime) => {
  return fetch(
    `${baseUrl}/apps/${appId}/room-activities?` +
      `startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
}

export const getRoomActivitiesByTenant = (baseUrl, token, tenantId, startTime, endTime) => {
  return fetch(
    `${baseUrl}/tenants/${tenantId}/room-activities?` +
      `startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
}

export const getConferencesByApp = (baseUrl, token, appId, startTime, endTime) => {
  return fetch(
    `${baseUrl}/apps/${appId}/conferences?` +
      `startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
}

export const getConferencesByTenant = (baseUrl, token, tenantId, startTime, endTime) => {
  return fetch(
    `${baseUrl}/tenants/${tenantId}/conferences?` +
      `startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
}

export const getParticipantAnalyticsByApp = (baseUrl, token, appId, startTime, endTime, interval) => {
  return fetch(
    `${baseUrl}/apps/${appId}/analytics/participants?` +
      `startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}&interval=${interval}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
}

export const getParticipantAnalyticsByTenant = (baseUrl, token, tenantId, startTime, endTime, interval) => {
  return fetch(
    `${baseUrl}/tenants/${tenantId}/analytics/participants?` +
      `startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}&interval=${interval}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
}

export const getConferenceAnalyticsByApp = (baseUrl, token, appId, startTime, endTime, interval) => {
  return fetch(
    `${baseUrl}/apps/${appId}/analytics/conferences?` +
      `startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}&interval=${interval}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
}

export const getConferenceAnalyticsByTenant = (baseUrl, token, tenantId, startTime, endTime, interval) => {
  return fetch(
    `${baseUrl}/tenants/${tenantId}/analytics/conferences?` +
      `startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}&interval=${interval}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
}
