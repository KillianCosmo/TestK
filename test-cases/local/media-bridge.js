import express from 'express'
import { createServer } from 'http'

import {
  randomId
} from '../../../lib/common/test'

import { setupApp } from '../../client/app'
import { setupTenant } from '../../client/tenant'

import {
  createRoom
} from '../../client/room'

import {
  createRegion,
  updateRegion,
  createMediaBridge,
  updateMediaBridge,
  getMediaBridgeRank,
  getMediaBridgeStats,
  getMediaBridgeHealth
} from '../../client/media-bridge'

import {
  listen
} from '../../../lib/common/core/listen'

const healthyHandler = (request, response) => {
  response.json({ ok: true })
}

const rankHandler = (request, response) => {
  response.json({ rank: 0.8 })
}

const statsHandler = (request, response) => {
  response.json({
    jvb_stats: {
      cpu: 0.7
    }
  })
}

const unhealthyHandler = (request, response) => {
  response.writeHead(500)
  response.end()
}

const createMockMediaBridgeController = async (prefix, port) => {
  const app = express()
  const router = express.Router()

  app.use(prefix, router)
  const server = createServer(app)

  const ctx = {
    app,
    router,
    server,
    rankHandler,
    statsHandler,
    healthHandler: healthyHandler
  }

  router.get('/health', (request, response) =>
    ctx.healthHandler(request, response))

  router.get('/stats', (request, response) =>
    ctx.statsHandler(request, response))

  router.get('/rank', (request, response) =>
    ctx.rankHandler(request, response))

  await listen(server, port)

  return ctx
}

export const testMediaBridge = async (t, testConfig) => {
  const {
    appConfig,
    rootToken,
    apiBaseUrl,
    clusterBaseUrl
  } = testConfig

  const {
    mediaBridgePrefix
  } = appConfig

  const networkHost = 'localhost'

  // Use an alternative controller port instead of 8000
  const controllerPort = 8084

  // Dummy WebSocket port. Not used in the test
  const websocketPort = 8010

  const regionId = await randomId()

  const ctx = await createMockMediaBridgeController(
    mediaBridgePrefix, controllerPort)

  const {
    tenantId, tenantToken
  } = await setupTenant(apiBaseUrl, rootToken)

  const {
    appId, appToken
  } = await setupApp(apiBaseUrl, tenantToken, tenantId)

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

  {
    t.comment('health API should forward health response from media bridge')

    const response = await getMediaBridgeHealth(
      clusterBaseUrl, rootToken, mediaBridgeId)

    t.ok(response.ok)

    const result = await response.json()
    t.equals(result.ok, true)
  }
  {
    t.comment('health API should return error 502 if controller return non success response')

    ctx.healthHandler = unhealthyHandler

    const response = await getMediaBridgeHealth(
      clusterBaseUrl, rootToken, mediaBridgeId)

    t.equals(response.status, 502)

    ctx.healthHandler = healthyHandler
  }
  {
    t.comment('stats API should forward stats result from controller')

    const response = await getMediaBridgeStats(
      clusterBaseUrl, rootToken, mediaBridgeId)

    t.ok(response.ok)

    const result = await response.json()
    t.equals(result.jvb_stats.cpu, 0.7)
  }
  {
    t.comment('stats API should return error 502 if controller return non success response')

    ctx.statsHandler = unhealthyHandler

    const response = await getMediaBridgeStats(
      clusterBaseUrl, rootToken, mediaBridgeId)

    t.equals(response.status, 502)

    ctx.statsHandler = statsHandler
  }
  {
    t.comment('rank API should forward rank result from controller')

    const response = await getMediaBridgeRank(
      clusterBaseUrl, rootToken, mediaBridgeId)

    t.ok(response.ok)

    const result = await response.json()
    t.equals(result.rank, 0.8)
  }
  {
    t.comment('rank API should return rank 0 if there is error in controller')

    ctx.rankHandler = unhealthyHandler

    const response = await getMediaBridgeRank(
      clusterBaseUrl, rootToken, mediaBridgeId)

    t.ok(response.ok)

    const result = await response.json()
    t.equals(result.rank, 0)

    ctx.rankHandler = rankHandler
  }
  {
    const response = await updateMediaBridge(
      clusterBaseUrl, rootToken, mediaBridgeId, {
        status: 'inactive'
      })

    t.ok(response.ok)
  }
  {
    t.comment('room creation should fail if no media bridge is available in the region')

    const response = await createRoom(
      apiBaseUrl, appToken, appId, 2, regionId)

    t.equals(response.status, 500)
  }
  {
    const response = await updateMediaBridge(
      clusterBaseUrl, rootToken, mediaBridgeId, {
        status: 'active'
      })

    t.ok(response.ok)
  }
  {
    t.comment('room creation should succeed if media bridge has recovered')

    const response = await createRoom(
      apiBaseUrl, appToken, appId, 2, regionId)

    t.equals(response.status, 202)
  }
  {
    const response = await updateRegion(
      clusterBaseUrl, rootToken, regionId, {
        status: 'disabled'
      })

    t.ok(response.ok)
  }
  {
    t.comment('room creation should fail if specified region is not enabled')

    const response = await createRoom(
      apiBaseUrl, appToken, appId, 2, regionId)

    t.equals(response.status, 500)
  }

  ctx.server.close()
}
