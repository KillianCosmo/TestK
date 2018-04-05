import {
  assertString
} from '../../../lib/common/test'

import { setupTenant } from '../../client/tenant'
import {
  setupApp,
  getAppInfo,
  disableApp
} from '../../client/app'

import {
  setupRoom,
  closeRoom,
  listRooms,
  createRoom,
  getRoomInfo,
  getRoomConfig,
  getXmppTunnel
} from '../../client/room'

import {
  listParticipants,
  createParticipant,
  getParticipantInfo,
  createParticipantToken
} from '../../client/participant'

export const roomTest = async (t, config) => {
  const { apiBaseUrl, rootToken } = config

  const {
    tenantId, tenantToken
  } = await setupTenant(apiBaseUrl, rootToken)

  const {
    appId, appToken
  } = await setupApp(apiBaseUrl, tenantToken, tenantId)

  const {
    appToken: appToken2
  } = await setupApp(apiBaseUrl, tenantToken, tenantId)

  {
    t.comment('apps should be able to create rooms')

    const response = await createRoom(
      apiBaseUrl, appToken, appId, 2)
    t.equals(response.status, 202)

    const roomResult = await response.json()
    const roomInfo = roomResult.room

    t.notOk(roomInfo.room_pk)
    const roomId = roomInfo.room_id
    assertString(t, roomId)

    const { participants } = roomResult

    t.ok(Array.isArray(participants))
    t.equals(participants.length, 2)

    for (const participantInfo of participants) {
      t.notOk(participantInfo.participant_pk)
      assertString(t, participantInfo.participant_id)

      const tokenInfo = participantInfo.token

      t.equals(tokenInfo.scope, 'participant')
      assertString(t, tokenInfo.access_token)
    }

    const [participant1, participant2] = participants

    {
      t.comment('participant API')

      const participantId1 = participant1.participant_id
      const participantId2 = participant2.participant_id

      const participantToken1 = participant1.token.access_token
      const participantToken2 = participant2.token.access_token

      t.notEquals(participantId1, participantId2)
      t.notEquals(participantToken1, participantToken2)

      {
        const response = await getParticipantInfo(apiBaseUrl, appToken, participantId1)
        t.ok(response.ok)

        const { participant } = await response.json()

        t.equals(participant.participant_id, participantId1)
      }
      {
        const response = await getParticipantInfo(apiBaseUrl, appToken, participantId2)
        t.ok(response.ok)

        const { participant } = await response.json()

        t.equals(participant.participant_id, participantId2)
      }
      {
        t.comment('app should able to access participant info')
        const response = await getParticipantInfo(apiBaseUrl, appToken, participantId1)
        t.ok(response.ok)

        const { participant } = await response.json()
        t.notOk(participant.participant_pk)
        t.equals(participant.participant_id, participantId1)
        t.equals(participant.room_id, roomId)
      }
      {
        t.comment('participant should able to access own info')
        const response = await getParticipantInfo(apiBaseUrl, participantToken1, participantId1)
        t.ok(response.ok)

        const { participant } = await response.json()
        t.notOk(participant.participant_pk)
        t.equals(participant.participant_id, participantId1)
        t.equals(participant.room_id, roomId)
      }
      {
        t.comment('participant token should not able to access other participant info')
        const response = await getParticipantInfo(apiBaseUrl, participantToken2, participantId1)
        t.equals(response.status, 401)
      }
      {
        t.comment('app should be able to list participants of a room')

        const response = await listParticipants(apiBaseUrl, appToken, roomId)
        t.ok(response.ok)

        const { participants } = await response.json()
        t.equals(participants.length, 2)

        const participant1 = participants.find(participant =>
          (participant.participant_id === participantId1))

        t.notOk(participant1.participant_pk)
        t.notOk(participant1.token)

        t.ok(participants.find(participant =>
          (participant.participant_id === participantId2)))
      }
      {
        t.comment('participant should not able to list participants')

        const response = await listParticipants(apiBaseUrl, participantToken1, roomId)
        t.equals(response.status, 401)
      }
    }

    const roomToken1 = participant1.token.access_token

    {
      t.comment('room token should be able to access same room info and config')

      const response1 = await getRoomInfo(apiBaseUrl, roomToken1, roomId)
      t.ok(response1.ok)

      const roomInfo = (await response1.json()).room
      t.notOk(roomInfo.room_pk)
      t.equals(roomInfo.room_id, roomId)
      t.equals(roomInfo.app_id, appId)

      const response2 = await getRoomConfig(apiBaseUrl, roomToken1, roomId)
      t.ok(response2.ok)

      const { config } = await response2.json()

      t.ok(config.hosts)
      assertString(t, config.bosh)
    }

    {
      t.comment('app token should be able to access room info and config')

      const response = await getRoomInfo(apiBaseUrl, appToken, roomId)
      t.ok(response.ok)

      const roomInfo = (await response.json()).room
      t.notOk(roomInfo.room_pk)
      t.equals(roomInfo.room_id, roomId)
      t.equals(roomInfo.app_id, appId)

      const response2 = await getRoomConfig(apiBaseUrl, appToken, roomId)
      t.ok(response2.ok)

      const { config } = await response2.json()

      t.ok(config.hosts)
      assertString(t, config.bosh)
    }
    {
      t.comment('app should be able to list rooms and find created room')

      const response = await listRooms(apiBaseUrl, appToken, appId)
      t.ok(response.ok)

      const result = await response.json()
      t.equals(result.app_id, appId)

      const { rooms } = result
      t.ok(Array.isArray(rooms))

      const roomInfo = rooms.find(room => (room.room_id === roomId))

      t.ok(roomInfo)
      t.notOk(roomInfo.room_pk)
    }
    {
      t.comment('participant should not able to list rooms')

      const response = await listRooms(apiBaseUrl, roomToken1, appId)
      t.equals(response.status, 401)
    }
    {
      t.comment('app should be able to create new token for participant')

      const response = await createParticipantToken(
        apiBaseUrl, appToken, participant1.participant_id)

      t.ok(response.ok)

      const { token } = await response.json()
      const roomToken2 = token.access_token

      t.notEquals(roomToken2, roomToken1)

      const response2 = await getRoomInfo(apiBaseUrl, roomToken2, roomId)
      t.ok(response2.ok)
    }
    {
      t.comment('app should be able to create new participant')
      const response1 = await createParticipant(apiBaseUrl, appToken, roomId)
      t.ok(response1.ok)

      const result = (await response1.json())

      assertString(t, result.participant_id)

      const roomToken = result.token.access_token
      assertString(t, roomToken)

      const response = await getRoomInfo(apiBaseUrl, roomToken, roomId)
      t.ok(response.ok)

      const roomInfo = (await response.json()).room
      t.equals(roomInfo.room_id, roomId)
    }
    {
      t.comment('different app token should not able to access room info and config')

      const response = await getRoomInfo(apiBaseUrl, appToken2, roomId)
      t.equals(response.status, 401)
    }
    {
      t.comment('different room token should not able to access room info and config')
      const {
        roomId: roomId2,
        roomToken: roomToken2
      } = await setupRoom(apiBaseUrl, appToken, appId)

      const response1 = await getRoomInfo(apiBaseUrl, roomToken2, roomId)
      t.equals(response1.status, 401)

      const response2 = await getRoomInfo(apiBaseUrl, roomToken1, roomId2)
      t.equals(response2.status, 401)
    }
    {
      t.comment('room token should not able to create room')
      const response = await createRoom(
        apiBaseUrl, roomToken1, appId, 1)
      t.equals(response.status, 401)
    }
    {
      t.comment('room token should not able to get app info')
      const response = await getAppInfo(apiBaseUrl, roomToken1, appId)
      t.equals(response.status, 401)
    }
  }
  {
    t.comment('apps should not able to create room for different app')
    const response = await createRoom(
      apiBaseUrl, appToken2, appId, 1)
    t.equals(response.status, 401)
  }
  {
    t.comment('room token should not able to access tunnel to closed room')

    const { roomId, roomToken } = await setupRoom(apiBaseUrl, appToken, appId)

    const response1 = await getXmppTunnel(apiBaseUrl, roomToken, roomId)
    t.ok(response1.ok)

    const response2 = await closeRoom(apiBaseUrl, appToken, roomId)
    t.ok(response2.ok)

    const response3 = await getXmppTunnel(apiBaseUrl, roomToken, roomId)
    t.equals(response3.status, 410)
  }
  {
    t.comment('disabled app should disallow access to app and room')

    const {
      tenantId, tenantToken
    } = await setupTenant(apiBaseUrl, rootToken)

    const {
      appId, appToken
    } = await setupApp(apiBaseUrl, tenantToken, tenantId)

    const {
      roomId, roomToken
    } = await setupRoom(apiBaseUrl, appToken, appId)

    {
      const response = await disableApp(apiBaseUrl, tenantToken, appId, true)
      t.ok(response.ok)
    }
    {
      const response = await getAppInfo(apiBaseUrl, tenantToken, appId)
      t.ok(response.ok)
    }
    {
      const response = await getAppInfo(apiBaseUrl, appToken, appId)
      t.equals(response.status, 403)
    }
    {
      const response = await getRoomInfo(apiBaseUrl, appToken, roomId)
      t.equals(response.status, 403)
    }
    {
      const response = await getRoomInfo(apiBaseUrl, roomToken, roomId)
      t.equals(response.status, 403)
    }
    {
      const response = await disableApp(apiBaseUrl, tenantToken, appId, false)
      t.ok(response.ok)
    }
    {
      const response = await getAppInfo(apiBaseUrl, appToken, appId)
      t.ok(response.ok)
    }
    {
      const response = await getRoomInfo(apiBaseUrl, appToken, roomId)
      t.ok(response.ok)
    }
    {
      const response = await getRoomInfo(apiBaseUrl, roomToken, roomId)
      t.ok(response.ok)
    }
  }
}
