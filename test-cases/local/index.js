import { asyncTest } from '../../../lib/common/test'

/* import { statsTest } from './stats'
import { testAggregate } from './aggregate'
import { testUtilFunctions } from './util'
import { testMediaBridge } from './media-bridge' */

const subTests = {
  /* 'media bridge proxy test': testMediaBridge,
  'aggregate duration tests': testAggregate,
  'stats API tests': statsTest,
  'utility function tests': testUtilFunctions */
}

export const testLocal = async (t, config) => {
  const runSubTest = (desc, testFunc) =>
    asyncTest(t, desc, async t => {
      await testFunc(t, config)
    })

  for (const [desc, subTest] of Object.entries(subTests)) {
    runSubTest(desc, subTest)
  }
}
