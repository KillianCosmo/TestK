import test from 'tape'

import { testRemote } from '../test-cases/remote'
import { asyncTest } from '../../lib/common/test'
import { readJsonFile } from '../../lib/common/fs'

asyncTest({ test }, 'WaveRTC Remote HTTP tests', async t => {
  const configPath = `config/remote-testing.json`
  const { testConfig } = await readJsonFile(configPath)

  await testRemote(t, testConfig)
})

process.on('unhandledRejection', err => {
  console.error('unhandled rejection:', err)
  process.exit(1)
})
