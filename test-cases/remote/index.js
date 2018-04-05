import { asyncTest } from '../../../lib/common/test'

/* import { appTest } from './app'
import { tokenTest } from './token'
import { roomTest } from './room'
import { tenantTest } from './tenant'
import { miscTest } from './misc'
import { conferenceTest } from './conference'
import { mediaBridgeTest } from './media-bridge' */
import { userTest } from './user'

const subTests = {
  /* 'misc tests': miscTest,
  'token tests': tokenTest,
  'tenant tests': tenantTest,
  'app tests': appTest,
  'room tests': roomTest,
  'conference tests': conferenceTest,
  'media bridge tests': mediaBridgeTest */
  'user test': userTest
}

export const testRemote = async (t, config) => {
  const runSubTest = (desc, testFunc) =>
    asyncTest(t, desc, async t => {
      await testFunc(t, config)
    })

  for (const [desc, subTest] of Object.entries(subTests)) {
    runSubTest(desc, subTest)
  }
}
