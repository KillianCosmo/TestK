import moment from 'moment'

import {
  getRoomActivitiesByApp,
  getRoomActivitiesByTenant,
  getConferencesByApp,
  getConferencesByTenant,
  getParticipantAnalyticsByApp,
  getParticipantAnalyticsByTenant,
  getConferenceAnalyticsByApp,
  getConferenceAnalyticsByTenant
} from '../../client/stats'

import { setupApp } from '../../client/app'
import { setupTenant } from '../../client/tenant'

import {
  setupRoom,
  getRoomDuration
} from '../../client/room'

import {
  loadHandler
} from '../../../lib/common/util'

import {
  createParticipantActivityHandler
} from '../../../lib/handler/participant/activity'

import {
  createConferenceHandler
} from '../../../lib/handler/conference/create'

const second = 1000
const minute = 60 * second
const hour = 60 * minute

export const statsTest = async (t, testConfig) => {
  const {
    appConfig,
    rootToken,
    apiBaseUrl
  } = testConfig

  // Import internal handlers to insert mock data directly
  const createParticipantActivity = await loadHandler(
    appConfig, createParticipantActivityHandler)

  const createConference = await loadHandler(
    appConfig, createConferenceHandler)

  const startDate = moment().startOf('month').subtract(1, 'days')
  const endDate = startDate.clone().add(1, 'days')

  const setupAll = async () => {
    const {
      tenantId, tenantToken
    } = await setupTenant(apiBaseUrl, rootToken)

    const {
      appId, appToken
    } = await setupApp(apiBaseUrl, tenantToken, tenantId)

    const {
      roomId, participantInfo, participantId
    } = await setupRoom(apiBaseUrl, appToken, appId)

    return {
      tenantId,
      tenantToken,
      appId,
      appToken,
      roomId,
      participantInfo,
      participantId
    }
  }

  const createActivities = async activities => {
    for (const activity of activities) {
      const [
        participantInfo,
        startTime,
        duration,
        unit
      ] = activity

      const endTime = startTime.clone().add(duration, unit)
      const participantId = participantInfo.participant_id

      await createParticipantActivity({
        participantId,
        startTime: startTime.toDate(),
        endTime: endTime.toDate()
      })
    }
  }

  const createConferences = async conferences => {
    for (const conference of conferences) {
      const [
        roomId,
        startTime,
        duration,
        unit
      ] = conference

      const endTime = startTime.clone().add(duration, unit)

      await createConference({
        roomId,
        startTime: startTime.toDate(),
        endTime: endTime.toDate()
      })
    }
  }

  {
    t.comment('app should initially have no room activities')

    const {
      appId
    } = await setupAll()

    const response = await getRoomActivitiesByApp(
      apiBaseUrl, rootToken, appId,
      startDate, endDate)

    t.ok(response.ok)

    const result = await response.json()
    t.equals(result.app_id, appId)
    t.deepEquals(result.activities, [])
  }
  {
    t.comment('tenant should initially have no room activities')

    const {
      tenantId
    } = await setupAll()

    const response = await getRoomActivitiesByTenant(
      apiBaseUrl, rootToken, tenantId,
      startDate, endDate)

    t.ok(response.ok)

    const result = await response.json()
    t.equals(result.tenant_id, tenantId)
    t.deepEquals(result.activities, [])
  }
  {
    t.comment('room duration should initially be zero')

    const {
      appToken, roomId
    } = await setupAll()

    const response = await getRoomDuration(apiBaseUrl, appToken, roomId)
    t.ok(response.ok)

    const result = await response.json()
    t.equals(result.room_id, roomId)
    t.equals(result.duration, 0)
  }
  {
    t.comment('participant analytics should initially return empty durations')

    const {
      appId
    } = await setupAll()

    const response = await getParticipantAnalyticsByApp(
      apiBaseUrl, rootToken, appId,
      startDate, endDate, hour)

    t.ok(response.ok)

    const result = await response.json()
    t.equals(result.app_id, appId)
    t.deepEquals(result.durations, new Array(24).fill(0))
  }
  {
    t.comment('conference analytics should initially return empty durations')

    const {
      tenantId
    } = await setupAll()

    const response = await getConferenceAnalyticsByTenant(
      apiBaseUrl, rootToken, tenantId,
      startDate, endDate, hour)

    t.ok(response.ok)

    const result = await response.json()
    t.equals(result.tenant_id, tenantId)
    t.deepEquals(result.durations, new Array(24).fill(0))
  }
  {
    t.comment('participant analytics should return 400 error if range is too large')

    const {
      appId
    } = await setupAll()

    const endDate = startDate.clone().add(1, 'years')

    const response = await getParticipantAnalyticsByApp(
      apiBaseUrl, rootToken, appId,
      startDate, endDate, minute)

    t.equals(response.status, 400)
  }
  {
    t.comment('conference analytics should return 400 error if range is too large')

    const {
      tenantId
    } = await setupAll()

    const endDate = startDate.clone().add(1, 'month')

    const response = await getConferenceAnalyticsByTenant(
      apiBaseUrl, rootToken, tenantId,
      startDate, endDate, minute)

    t.equals(response.status, 400)
  }
  {
    t.comment('participant activities should not return activities before of date range')

    const {
      appId, participantId
    } = await setupAll()

    const startTime = startDate.clone().subtract(2, 'hours')
    const endTime = startTime.clone().add(10, 'minutes')

    await createParticipantActivity({
      participantId,
      startTime,
      endTime
    })

    const response = await getRoomActivitiesByApp(
      apiBaseUrl, rootToken, appId,
      startDate, endDate)

    t.ok(response.ok)

    const result = await response.json()
    t.equals(result.app_id, appId)
    t.deepEquals(result.activities, [])
  }
  {
    t.comment('participant activities should not return activities after of date range')

    const {
      appId, participantId
    } = await setupAll()

    const startTime = endDate.clone().add(2, 'hours')
    const endTime = startTime.clone().add(10, 'minutes')

    await createParticipantActivity({
      participantId,
      startTime,
      endTime
    })

    const response = await getRoomActivitiesByApp(
      apiBaseUrl, rootToken, appId,
      startDate, endDate)

    t.ok(response.ok)

    const result = await response.json()
    t.equals(result.app_id, appId)
    t.deepEquals(result.activities, [])
  }
  {
    const {
      appId, tenantId, roomId, participantId
    } = await setupAll()

    const startTime = startDate.clone().add(1, 'hours')
    const endTime = startTime.clone().add(15, 'minutes')

    await createParticipantActivity({
      participantId,
      startTime,
      endTime
    })

    {
      t.comment('app should have activities after inserting activities with overlapping time range')

      const response = await getRoomActivitiesByApp(
        apiBaseUrl, rootToken, appId,
        startDate, endDate)

      t.ok(response.ok)

      const result = await response.json()
      t.equals(result.app_id, appId)

      const { activities } = result
      t.equals(activities.length, 1)

      const [activity] = activities

      t.equals(activity.room_id, roomId)
      t.equals(activity.participant_id, participantId)
      t.ok(startTime.isSame(activities[0].start_time, 's'))
      t.ok(endTime.isSame(activities[0].end_time, 's'))
    }
    {
      t.comment('tenant should have activities after inserting activities with overlapping time range')

      const response = await getRoomActivitiesByTenant(
        apiBaseUrl, rootToken, tenantId,
        startDate, endDate)

      t.ok(response.ok)

      const result = await response.json()
      t.equals(result.tenant_id, tenantId)

      const { activities } = result
      t.equals(activities.length, 1)

      const [activity] = activities

      t.equals(activity.app_id, appId)
      t.equals(activity.room_id, roomId)
      t.equals(activity.participant_id, participantId)
      t.ok(startTime.isSame(activities[0].start_time, 's'))
      t.ok(endTime.isSame(activities[0].end_time, 's'))
    }
    {
      t.comment('participant analytics shoulds return durations with time overlapped with date range')

      const response = await getParticipantAnalyticsByTenant(
        apiBaseUrl, rootToken, tenantId,
        startDate, endDate, hour)

      t.ok(response.ok)

      const result = await response.json()
      t.equals(result.tenant_id, tenantId)

      const expected = new Array(24).fill(0)
      expected[1] = 15 * minute
      t.deepEquals(result.durations, expected)
    }
  }
  {
    t.comment('participant activities should return activities with time overlapped with date range')

    const {
      appId, participantId
    } = await setupAll()

    const startTime = startDate.clone().subtract(1, 'hours')
    const endTime = startTime.clone().add(2, 'hours')

    await createParticipantActivity({
      participantId,
      startTime,
      endTime
    })

    const response = await getRoomActivitiesByApp(
      apiBaseUrl, rootToken, appId,
      startDate, endDate)

    t.ok(response.ok)

    const result = await response.json()
    t.equals(result.app_id, appId)
    t.equals(result.activities.length, 1)
  }
  {
    t.comment('app should initially have no conferences')

    const {
      appId
    } = await setupAll()

    const response = await getConferencesByApp(
      apiBaseUrl, rootToken, appId,
      startDate, endDate)

    t.ok(response.ok)

    const result = await response.json()
    t.equals(result.app_id, appId)
    t.deepEquals(result.conferences, [])
  }
  {
    t.comment('tenant should initially have no conferences')

    const {
      tenantId
    } = await setupAll()

    const response = await getConferencesByTenant(
      apiBaseUrl, rootToken, tenantId,
      startDate, endDate)

    t.ok(response.ok)

    const result = await response.json()
    t.equals(result.tenant_id, tenantId)
    t.deepEquals(result.conferences, [])
  }
  {
    const {
      tenantId, appId, appToken, roomId
    } = await setupAll()

    const startTime = startDate.clone().add(1, 'hours')
    const endTime = startTime.clone().add(20, 'minutes')

    await createConference({
      roomId,
      startTime: startTime.toDate(),
      endTime: endTime.toDate()
    })

    {
      t.comment('room should have duration after inserting conference')

      const response = await getRoomDuration(apiBaseUrl, appToken, roomId)
      t.ok(response.ok)

      const result = await response.json()
      t.equals(result.room_id, roomId)
      t.equals(result.duration, 20 * minute)
    }
    {
      t.comment('app should have conferences after inserting conference with overlapping time range')

      const response = await getConferencesByApp(
        apiBaseUrl, rootToken, appId,
        startDate, endDate)

      t.ok(response.ok)

      const result = await response.json()
      t.equals(result.app_id, appId)

      const { conferences } = result
      t.equals(conferences.length, 1)

      const [conference] = conferences

      t.equals(conference.room_id, roomId)
      t.ok(startTime.isSame(conference.start_time, 's'))
      t.ok(endTime.isSame(conference.end_time, 's'))
    }
    {
      t.comment('tenant should have conferences after inserting conference with overlapping time range')

      const response = await getConferencesByTenant(
        apiBaseUrl, rootToken, tenantId,
        startDate, endDate)

      t.ok(response.ok)

      const result = await response.json()
      t.equals(result.tenant_id, tenantId)

      const { conferences } = result
      t.equals(conferences.length, 1)

      const [conference] = conferences

      t.equals(conference.room_id, roomId)
      t.ok(startTime.isSame(conference.start_time, 's'))
      t.ok(endTime.isSame(conference.end_time, 's'))
    }
    {
      t.comment('conference analytics shoulds return durations with time overlapped with date range')

      const response = await getConferenceAnalyticsByApp(
        apiBaseUrl, rootToken, appId,
        startDate, endDate, hour)

      t.ok(response.ok)

      const result = await response.json()
      t.equals(result.app_id, appId)

      const expected = new Array(24).fill(0)
      expected[1] = 20 * minute
      t.deepEquals(result.durations, expected)
    }
  }
  {
    t.comment('aggregated stats test')

    const {
      tenantId
    } = await setupTenant(apiBaseUrl, rootToken)

    const {
      appId: appId1,
      appToken: appToken1
    } = await setupApp(apiBaseUrl, rootToken, tenantId)

    const {
      appId: appId2,
      appToken: appToken2
    } = await setupApp(apiBaseUrl, rootToken, tenantId)

    const {
      roomId: roomId11,
      participants: [participant111, participant112]
    } = await setupRoom(apiBaseUrl, appToken1, appId1)

    const {
      roomId: roomId12,
      participants: [participant12]
    } = await setupRoom(apiBaseUrl, appToken1, appId1)

    const {
      roomId: roomId2,
      participants: [participant2]
    } = await setupRoom(apiBaseUrl, appToken2, appId2)

    await createActivities([
      [
        participant111,
        startDate.clone().subtract(15, 'minutes'),
        30, 'minutes'
      ],
      [
        participant112,
        startDate.clone().add(10, 'minutes'),
        70, 'minutes'
      ],
      [
        participant12,
        startDate.clone().add(5, 'hours').add(55, 'minutes'),
        345, 'seconds'
      ],
      [
        participant2,
        endDate.clone().subtract(90, 'minutes'),
        2, 'hours'
      ]
    ])

    await createConferences([
      [
        roomId11,
        startDate.clone().subtract(15, 'minutes'),
        95, 'minutes'
      ],
      [
        roomId12,
        startDate.clone().add(5, 'hours').add(55, 'minutes'),
        345, 'seconds'
      ],
      [
        roomId2,
        endDate.clone().subtract(90, 'minutes'),
        2, 'hours'
      ]
    ])

    {
      t.comment('participant analytics by tenant should return participant durations of all apps and rooms')

      const response = await getParticipantAnalyticsByTenant(
        apiBaseUrl, rootToken, tenantId,
        startDate, endDate, hour)

      t.ok(response.ok)

      const result = await response.json()
      t.equals(result.tenant_id, tenantId)

      const expected = new Array(24).fill(0)
      expected[0] = 65 * minute
      expected[1] = 20 * minute
      expected[5] = 5 * minute
      expected[6] = 45 * second
      expected[22] = 30 * minute
      expected[23] = hour

      t.deepEquals(result.durations, expected)
    }
    {
      t.comment('participant analytics with interval same as range should return total duration')

      const response = await getParticipantAnalyticsByTenant(
        apiBaseUrl, rootToken, tenantId,
        startDate, endDate, 24 * hour)

      t.ok(response.ok)

      const result = await response.json()
      t.equals(result.tenant_id, tenantId)

      const expected = [225 * minute]

      t.deepEquals([225 * minute], expected)
    }
    {
      t.comment('participant analytics by app 1 should return participant durations of first app only')

      const response = await getParticipantAnalyticsByApp(
        apiBaseUrl, rootToken, appId1,
        startDate, endDate, hour)

      t.ok(response.ok)

      const result = await response.json()
      t.equals(result.app_id, appId1)

      const expected = new Array(24).fill(0)
      expected[0] = 65 * minute
      expected[1] = 20 * minute
      expected[5] = 5 * minute
      expected[6] = 45 * second

      t.deepEquals(result.durations, expected)
    }
    {
      t.comment('participant analytics by app 2 should return participant durations of second app only')

      const response = await getParticipantAnalyticsByApp(
        apiBaseUrl, rootToken, appId2,
        startDate, endDate, hour)

      t.ok(response.ok)

      const result = await response.json()
      t.equals(result.app_id, appId2)

      const expected = new Array(24).fill(0)
      expected[22] = 30 * minute
      expected[23] = hour

      t.deepEquals(result.durations, expected)
    }
    {
      t.comment('conference analytics by tenant should return conference durations of all apps and rooms')

      const response = await getConferenceAnalyticsByTenant(
        apiBaseUrl, rootToken, tenantId,
        startDate, endDate, hour)

      t.ok(response.ok)

      const result = await response.json()
      t.equals(result.tenant_id, tenantId)

      const expected = new Array(24).fill(0)
      expected[0] = 60 * minute
      expected[1] = 20 * minute
      expected[5] = 5 * minute
      expected[6] = 45 * second
      expected[22] = 30 * minute
      expected[23] = hour

      t.deepEquals(result.durations, expected)
    }
    {
      t.comment('conference analytics by app 1 should return conference durations of first app only')

      const response = await getConferenceAnalyticsByApp(
        apiBaseUrl, rootToken, appId1,
        startDate, endDate, hour)

      t.ok(response.ok)

      const result = await response.json()
      t.equals(result.app_id, appId1)

      const expected = new Array(24).fill(0)
      expected[0] = 60 * minute
      expected[1] = 20 * minute
      expected[5] = 5 * minute
      expected[6] = 45 * second

      t.deepEquals(result.durations, expected)
    }
    {
      t.comment('conference analytics by app 2 should return conference durations of second app only')

      const response = await getConferenceAnalyticsByApp(
        apiBaseUrl, rootToken, appId2,
        startDate, endDate, hour)

      t.ok(response.ok)

      const result = await response.json()
      t.equals(result.app_id, appId2)

      const expected = new Array(24).fill(0)
      expected[22] = 30 * minute
      expected[23] = hour

      t.deepEquals(result.durations, expected)
    }
  }
}
