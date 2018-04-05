import {
  randomId
} from '../../../lib/common/test'

import { setupApp } from '../../client/app'
import { setupTenant } from '../../client/tenant'

import {
  createRoom
} from '../../client/room'

import {
  listRegions,
  createRegion,
  getMediaBridgeInfo,
  getMediaBridgeFromRoom,
  listMediaBridges,
  createMediaBridge,
  updateMediaBridge
} from '../../client/media-bridge'

export const mediaBridgeTest = async (t, config) => {
  const { apiBaseUrl, clusterBaseUrl, rootToken } = config

  const {
    tenantId, tenantToken
  } = await setupTenant(apiBaseUrl, rootToken)

  const {
    appId, appToken
  } = await setupApp(apiBaseUrl, tenantToken, tenantId)

  const regionId = await randomId()
  const networkHost = 'localhost'
  const controllerPort = 8010
  const websocketPort = 8010

  {
    const response = await createRegion(clusterBaseUrl, rootToken, regionId)

    t.ok(response.ok)
  }
  {
    const response = await createRegion(clusterBaseUrl, rootToken, regionId)

    t.equals(response.status, 409)
  }
  {
    const response = await listRegions(apiBaseUrl, rootToken)
    t.ok(response.ok)

    const { regions } = await response.json()
    t.ok(regions.find(region => (region.region_id === regionId)))
  }

  let mediaBridgeId
  {
    const response = await createMediaBridge(clusterBaseUrl, rootToken,
      regionId, networkHost, controllerPort, websocketPort)

    t.ok(response.ok)
    const mediaBridgeInfo = (await response.json()).media_bridge

    t.notOk(mediaBridgeInfo.media_bridge_pk)
    t.notOk(mediaBridgeInfo.sort_order)
    t.equals(mediaBridgeInfo.network_host, networkHost)
    t.equals(mediaBridgeInfo.controller_port, controllerPort)
    t.equals(mediaBridgeInfo.websocket_port, websocketPort)

    mediaBridgeId = mediaBridgeInfo.media_bridge_id
  }
  {
    const response = await getMediaBridgeInfo(apiBaseUrl, rootToken, mediaBridgeId)
    t.ok(response.ok)

    const mediaBridgeInfo = (await response.json()).media_bridge

    t.notOk(mediaBridgeInfo.media_bridge_pk)
    t.notOk(mediaBridgeInfo.sort_order)
    t.equals(mediaBridgeInfo.media_bridge_id, mediaBridgeId)
    t.equals(mediaBridgeInfo.network_host, networkHost)
    t.equals(mediaBridgeInfo.controller_port, controllerPort)
    t.equals(mediaBridgeInfo.websocket_port, websocketPort)
    t.equals(mediaBridgeInfo.status, 'active')
  }
  {
    const response = await listMediaBridges(apiBaseUrl, rootToken, regionId)
    t.ok(response.ok)

    const mediaBridges = (await response.json()).media_bridges
    t.equals(mediaBridges.length, 1)

    const [mediaBridgeInfo] = mediaBridges

    t.notOk(mediaBridgeInfo.media_bridge_pk)
    t.notOk(mediaBridgeInfo.sort_order)
    t.equals(mediaBridgeInfo.media_bridge_id, mediaBridgeId)
    t.equals(mediaBridgeInfo.network_host, networkHost)
    t.equals(mediaBridgeInfo.controller_port, controllerPort)
    t.equals(mediaBridgeInfo.websocket_port, websocketPort)
    t.equals(mediaBridgeInfo.status, 'active')
  }

  let roomId
  {
    const response = await createRoom(apiBaseUrl, appToken,
      appId, 1, regionId)

    t.equals(response.status, 202)

    const roomInfo = (await response.json()).room
    roomId = roomInfo.room_id
  }
  {
    const response = await getMediaBridgeFromRoom(apiBaseUrl, rootToken, roomId)
    t.ok(response)

    // Since we created a region with only one media bridge,
    // rooms created in that region must be assigned to that
    // media bridge
    const mediaBridgeInfo = (await response.json()).media_bridge

    t.equals(mediaBridgeInfo.media_bridge_id, mediaBridgeId)
    t.equals(mediaBridgeInfo.network_host, networkHost)
    t.equals(mediaBridgeInfo.controller_port, controllerPort)
    t.equals(mediaBridgeInfo.websocket_port, websocketPort)
    t.equals(mediaBridgeInfo.status, 'active')
  }
  {
    const response = await updateMediaBridge(clusterBaseUrl, rootToken,
      mediaBridgeId, {
        network_host: '127.0.0.2',
        controller_port: 8110,
        websocket_port: 8120,
        status: 'inactive'
      })
    t.ok(response.ok)

    const mediaBridgeInfo = (await response.json()).media_bridge

    t.equals(mediaBridgeInfo.media_bridge_id, mediaBridgeId)
    t.equals(mediaBridgeInfo.network_host, '127.0.0.2')
    t.equals(mediaBridgeInfo.controller_port, 8110)
    t.equals(mediaBridgeInfo.websocket_port, 8120)
    t.equals(mediaBridgeInfo.status, 'inactive')
  }
  {
    const response = await createRoom(apiBaseUrl, appToken,
      appId, 1, regionId)

    t.equals(response.status, 500)
  }
}
