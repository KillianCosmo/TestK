import WebSocket from 'ws'

import {
  randomId,
  asyncTest,
  assertRejected
} from '../../lib/common/test'

import {
  timeout
} from '../../lib/common/util'

import { setupApp } from '../client/app'
import { setupTenant } from '../client/tenant'

import {
  closeRoom,
  createRoom,
  getRoomActivities,
  setupRoom
} from '../client/room'

import {
  createRegion,
  createMediaBridge,
  updateMediaBridge
} from '../client/media-bridge'

/*
  Create a mock websocket server to test that the WebSocket traffic
  is tunneled correctly. Note that XMPP is not used here, as the
  tunnel API is just a transparent WebSocket proxy between the
  lib-jitsi-meet client and Prosody.
 */
const createMockWebSocketServer = (port, pong) => {
  const server = new WebSocket.Server({ port })

  server.on('connection', socket => {
    socket.on('message', message => {
      socket.send(`${pong}: ${message}`)

      if (message === 'bye') {
        socket.close()
      }
    })
  })

  return server
}

const waitEnd = client =>
  new Promise((resolve, reject) => {
    client.on('close', resolve)
    client.on('error', reject)
  })

const createWebSocketClient = url => {
  const client = new WebSocket(url)

  return new Promise((resolve, reject) => {
    client.on('open', () =>
      resolve([client, waitEnd(client)]))

    client.on('error', reject)
  })
}

const sendMessage = (client, message) => {
  client.send(message)

  return new Promise(resolve =>
    client.on('message', resolve))
}

export const xmppTest = async (t, config) => {
  const {
    rootToken,
    apiBaseUrl,
    xmppBaseUrl,
    clusterBaseUrl
  } = config

  const networkHost = 'localhost'

  // Dummy controller port. Not used in the test
  const controllerPort = 8010

  // Use an alternative websocket port instead of 5280 so that the test can be
  // run in environments with Prosody already running
  const websocketPort = 8010

  const server = createMockWebSocketServer(websocketPort, 'pong')

  const {
    tenantId, tenantToken
  } = await setupTenant(apiBaseUrl, rootToken)

  const {
    appId, appToken
  } = await setupApp(apiBaseUrl, tenantToken, tenantId)

  const regionId = await randomId()

  {
    t.comment('websocket sanity test')
    const [client, endPromise] = await createWebSocketClient('ws://localhost:8010')

    const reply1 = await sendMessage(client, 'hello')
    t.equals(reply1, `pong: hello`)

    const reply2 = await sendMessage(client, 'bye')
    t.equals(reply2, `pong: bye`)

    await endPromise
  }
  {
    const response = await createRegion(clusterBaseUrl, rootToken, regionId)
    t.ok(response.ok)
  }

  let mediaBridgeId
  {
    const response = await createMediaBridge(clusterBaseUrl, rootToken,
      regionId, networkHost, controllerPort, websocketPort)

    t.ok(response.ok)

    const mediaBridgeInfo = (await response.json()).media_bridge
    mediaBridgeId = mediaBridgeInfo.media_bridge_id
  }

  let roomId, roomToken
  let participantId
  {
    const response = await createRoom(
      apiBaseUrl, appToken, appId, 2, regionId)
    t.ok(response.ok)

    const roomResult = await response.json()
    const roomInfo = roomResult.room

    roomId = roomInfo.room_id
    const [participant] = roomResult.participants

    roomToken = participant.token.access_token
    participantId = participant.participant_id
  }
  {
    t.comment('initial room activity should be empty')

    const response = await getRoomActivities(apiBaseUrl, appToken, roomId)
    t.ok(response)

    const result = await response.json()

    t.equals(result.room_id, roomId)
    t.deepEquals(result.activities, [])
  }

  const xmppUrl = `${xmppBaseUrl}/tunnel/xmpp?room=${roomId}&token=${roomToken}`

  {
    t.comment('tunneling with valid room ID and token should succeed')

    const [client, endPromise] = await createWebSocketClient(xmppUrl)

    const reply1 = await sendMessage(client, 'hello')
    t.equals(reply1, `pong: hello`)

    await timeout(100)

    const reply2 = await sendMessage(client, 'bye')
    t.equals(reply2, `pong: bye`)

    await endPromise
  }
  {
    t.comment('room activity should have one entry after first tunneling')

    const response = await getRoomActivities(apiBaseUrl, appToken, roomId)
    t.ok(response)

    const result = await response.json()
    t.equals(result.room_id, roomId)

    const { activities } = result
    t.equals(activities.length, 1)

    const [activity] = activities
    t.equals(activity.participant_id, participantId)

    const startTime = Date.parse(activity.start_time)
    const endTime = Date.parse(activity.end_time)

    t.notOk(Number.isNaN(startTime))
    t.notOk(Number.isNaN(endTime))

    const duration = endTime - startTime

    t.ok(duration >= 100)
  }
  {
    t.comment('tunneling with 2 concurrent clients should succeed')

    const [client1, endPromise1] = await createWebSocketClient(xmppUrl)
    const [client2, endPromise2] = await createWebSocketClient(xmppUrl)

    const [reply1, reply2] = await Promise.all([
      sendMessage(client1, 'hello'),
      sendMessage(client2, 'hi')
    ])

    t.equals(reply1, `pong: hello`)
    t.equals(reply2, `pong: hi`)

    await sendMessage(client1, 'bye')
    await sendMessage(client2, 'bye')

    await endPromise1
    await endPromise2
  }

  await assertRejected(t, createWebSocketClient(
    `${xmppBaseUrl}/tunnel/xmpp?room=${roomId}`),
  'Tunneling with no room token should fail')

  await assertRejected(t, createWebSocketClient(
    `${xmppBaseUrl}/tunnel/xmpp?room=foo&token=${roomToken}`),
  'Tunneling with invalid room ID should fail')

  await assertRejected(t, createWebSocketClient(
    `${xmppBaseUrl}/tunnel/xmpp?room=foo&token=${appToken}`),
  'Tunneling with invalid app token should fail')

  await assertRejected(t, createWebSocketClient(
    `${xmppBaseUrl}/tunnel/invalid?room=${roomId}&token=${roomToken}`),
  'Tunneling with invalid path should fail')

  {
    const {
      roomId: roomId2,
      roomToken: roomToken2
    } = await setupRoom(apiBaseUrl, appToken, appId)

    await assertRejected(t, createWebSocketClient(
      `${xmppBaseUrl}/tunnel/xmpp?room=${roomId}&token=${roomToken2}`),
    'Tunneling with different room token should fail')

    await assertRejected(t, createWebSocketClient(
      `${xmppBaseUrl}/tunnel/xmpp?room=${roomId2}&token=${roomToken}`),
    'Tunneling with different room ID should fail')
  }

  server.close()
  await assertRejected(t, createWebSocketClient(xmppUrl),
    'Tunneling to crashed media bridge should fail')

  const server2 = createMockWebSocketServer(websocketPort, 'pong')
  {
    t.comment('Tunneling to recovered server should succeed')

    const [client, endPromise] = await createWebSocketClient(xmppUrl)
    const reply1 = await sendMessage(client, 'hello')
    t.equals(reply1, `pong: hello`)

    const reply2 = await sendMessage(client, 'bye')
    t.equals(reply2, `pong: bye`)

    await endPromise
  }

  const server3 = createMockWebSocketServer(8013, 'backup')

  {
    t.comment('Updating media bridge should redirect future traffic to new address')

    const [client1, endPromise1] = await createWebSocketClient(xmppUrl)

    const response = await updateMediaBridge(clusterBaseUrl, rootToken,
      mediaBridgeId, {
        websocket_port: 8013
      })
    t.ok(response.ok)

    const [client2, endPromise2] = await createWebSocketClient(xmppUrl)

    const reply1 = await sendMessage(client1, 'hello')
    t.equals(reply1, `pong: hello`,
      'clients connected before media bridge update should stay connect to original server')

    const reply2 = await sendMessage(client2, 'hello')
    t.equals(reply2, `backup: hello`,
      'clients connected after media bridge update should connect to new server')

    await sendMessage(client1, 'bye')
    await sendMessage(client2, 'bye')

    await endPromise1
    await endPromise2
  }
  {
    t.comment('Tunneling to closed room should fail')

    const response = await closeRoom(apiBaseUrl, appToken, roomId)
    t.ok(response.ok)

    await assertRejected(t, createWebSocketClient(xmppUrl))
  }

  server2.close()
  server3.close()
}

export const testXmpp = async (t, config) => {
  asyncTest(t, 'XMPP Proxy test', async t => {
    await xmppTest(t, config)
  })
}
