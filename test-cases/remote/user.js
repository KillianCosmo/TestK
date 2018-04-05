import {
//  assertString
//  assertDateString
  randomId
} from '../../../lib/common/test'

import {
  registerUser
// login
} from '../../client/user'

export const userTest = async (t, config) => {
  const { apiBaseUrl, rootToken } = config
  const usr = await randomId()
  {
    t.comment('POST /user should create a new user')
    const response = await registerUser(apiBaseUrl, rootToken, {'scope': 'root', 'username': usr, 'password': 'pwdTest', 'tenant_id': ''})
    t.ok(response.ok)

    const user = (await response.json()).user
    console.log(user)
  }
  {
    t.comment('POST /user with the same username')
    const response = await registerUser(apiBaseUrl, rootToken, {'scope': 'root', 'username': usr, 'password': 'pwdTest', 'tenant_id': ''})
    t.equals(response.status, 409)
  }
  {
    t.comment('POST /user with too long username')
    const response = await registerUser(apiBaseUrl, rootToken, {'scope': 'root', 'username': 'a'.repeat(256), 'password': 'pwdTest', 'tenant_id': ''})
    t.equals(response.status, 400)
  }
}
