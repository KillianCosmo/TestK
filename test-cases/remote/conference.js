import {
  assertString
} from '../../../lib/common/test'

import { setupApp } from '../../client/app'
import { setupRoom } from '../../client/room'
import { setupTenant } from '../../client/tenant'

import {
  endConference,
  listConferences,
  createConference,
  getConferenceInfo,
  getReservationInfo,
  getOngoingConference
} from '../../client/conference'

export const conferenceTest = async (t, config) => {
  const { apiBaseUrl, clusterBaseUrl, rootToken } = config

  const {
    tenantId, tenantToken
  } = await setupTenant(apiBaseUrl, rootToken)

  const {
    appId, appToken
  } = await setupApp(apiBaseUrl, tenantToken, tenantId)

  const {
    roomId
  } = await setupRoom(apiBaseUrl, appToken, appId)

  t.comment('conference creation test')

  {
    t.comment('room should initially has no ongoing conference')

    const response = await getOngoingConference(
      clusterBaseUrl, roomId)

    t.ok(response.ok)

    const { conference } = await response.json()

    t.equals(conference, null)
  }
  {
    const response = await listConferences(apiBaseUrl, appToken, roomId)

    t.ok(response.ok)

    const { conferences } = await response.json()

    t.equals(conferences.length, 0)
  }
  {
    const response = await createConference(
      clusterBaseUrl, roomId)

    t.ok(response.ok)

    const { conference } = await response.json()

    t.notOk(conference.conference_pk)

    const conferenceId = conference.conference_id
    assertString(t, conferenceId)

    const reservationId = conference.reservation_id
    t.ok(Number.isInteger(reservationId))

    t.equals(conference.room_id, roomId)

    t.ok(conference.max_duration)
    t.ok(conference.start_time)

    {
      const response = await getOngoingConference(
        clusterBaseUrl, roomId)

      t.ok(response.ok)
      const conference2 = (await response.json()).conference

      t.notOk(conference2.conference_pk)
      t.equals(conference2.conference_id, conferenceId)
    }
    {
      const response = await listConferences(apiBaseUrl, appToken, roomId)

      t.ok(response.ok)

      const { conferences } = await response.json()

      t.equals(conferences.length, 1)
      const [ conference ] = conferences

      t.notOk(conference.conference_pk)
      t.equals(conference.conference_id, conferenceId)
    }
    {
      const response = await getConferenceInfo(
        clusterBaseUrl, conferenceId)

      t.ok(response.ok)
      const conference2 = (await response.json()).conference
      t.notOk(conference2.conference_pk)
      t.equals(conference2.conference_id, conferenceId)
    }
    {
      const response = await getReservationInfo(
        clusterBaseUrl, reservationId)

      t.ok(response.ok)
      const conference2 = (await response.json()).conference
      t.notOk(conference2.conference_pk)
      t.equals(conference2.conference_id, conferenceId)
    }
    {
      const response = await createConference(
        clusterBaseUrl, roomId)

      t.equals(response.status, 409)
      const conflict = await response.json()

      t.equals(conflict.room_id, roomId)
      t.equals(conflict.conference.conference_id, conferenceId)
    }
    {
      const response = await endConference(
        clusterBaseUrl, conferenceId)

      t.ok(response.ok)
    }
    {
      t.comment('room should have no ongoing conference after conference ended')

      const response = await getOngoingConference(
        clusterBaseUrl, roomId)

      t.ok(response.ok)
      const { conference } = await response.json()

      t.equals(conference, null)
    }
    {
      const response = await listConferences(apiBaseUrl, appToken, roomId)

      t.ok(response.ok)

      const { conferences } = await response.json()

      t.equals(conferences.length, 1)
      t.equals(conferences[0].conference_id, conferenceId)
    }
  }
}
