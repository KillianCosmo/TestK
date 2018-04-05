import test from 'tape'

// import { testXmpp } from '../test-cases/xmpp'
import { testLocal } from '../test-cases/local'
import { testRemote } from '../test-cases/remote'
import { asyncTest } from '../../lib/common/test'

import { setupLocalServer } from './setup'
import { loadAppConfig } from '../../lib/config'

asyncTest({ test }, 'WaveRTC local server test',
  async t => {
    const config = await loadAppConfig({
      nodeEnv: 'testing'
    })

    const testConfig = await setupLocalServer(config)

    const { logger } = config
    logger.info('Running tests with root token %s', testConfig.rootToken)

    testRemote(t, testConfig)
    // testXmpp(t, testConfig)
    testLocal(t, testConfig)
  })

test.onFinish(() => process.exit(0))

process.on('unhandledRejection', err => {
  console.error('unhandled rejection:', err)
  process.exit(1)
})
