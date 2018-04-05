import test from 'tape'

import { setupLocalServer } from './setup'
import { testXmpp } from '../test-cases/xmpp'
import { loadAppConfig } from '../../lib/config'
import { asyncTest } from '../../lib/common/test'

asyncTest({ test }, 'WaveRTC XMPP server test', async t => {
  const config = await loadAppConfig({
    nodeEnv: 'testing'
  })
  const testConfig = await setupLocalServer(config)

  const { logger } = config
  logger.info('Running XMPP proxy tests with root token %s', testConfig.rootToken)

  await testXmpp(t, testConfig)
})

test.onFinish(() => process.exit(0))

process.on('unhandledRejection', err => {
  console.error('unhandled rejection:', err)
  process.exit(1)
})
