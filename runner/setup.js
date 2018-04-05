import { loadHandler } from '../../lib/common/util'
import { runAllServer } from '../../lib/server/all'
import { createRootTokenHandler } from '../../lib/handler/token/create'

export const setupLocalServer = async config => {
  const { pathPrefix, serverConfig } = config

  const {
    apiServerPort,
    xmppServerPort,
    clusterServerPort
  } = serverConfig

  const createRootToken = await loadHandler(config, createRootTokenHandler)
  const rootToken = (await createRootToken({})).token.access_token

  await runAllServer(config)

  const testConfig = {
    rootToken,
    appConfig: config,
    apiBaseUrl: `http://localhost:${apiServerPort}${pathPrefix}`,
    xmppBaseUrl: `ws://localhost:${xmppServerPort}${pathPrefix}`,
    clusterBaseUrl: `http://localhost:${clusterServerPort}${pathPrefix}`
  }

  return testConfig
}
