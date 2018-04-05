import bunyan from 'bunyan'
import express from 'express'
import fetch from 'node-fetch'
import { createServer } from 'http'

import {
  timeout,
  loadHandler,
  jsonHandler,
  extractParam,
  timeoutPromise
} from '../../../lib/common/util'

import {
  assertRejected,
  assertFulfilled
} from '../../../lib/common/test'

import {
  errorHandler
} from '../../../lib/common/express'

import {
  listen
} from '../../../lib/common/core/listen'

export const testUtilFunctions = async (t, config) => {
  t.comment('timeout promise test')

  await assertRejected(t, timeoutPromise(new Promise(() => {}), 100))
  await assertFulfilled(t, timeoutPromise(timeout(50), 200))

  {
    t.comment('loadHandler() test')

    let counter = 0

    const builder = async config => {
      t.equals(config.foo, 'fooValue')

      const count = counter++

      return async args => {
        t.equals(args.bar, 'barValue')

        return { count }
      }
    }

    const config = {
      foo: 'fooValue'
    }

    t.comment('loadHandler with same config should always load the same handler')

    const handler1 = await loadHandler(config, builder)
    const handler2 = await loadHandler(config, builder)

    const args = {
      bar: 'barValue'
    }

    t.equals((await handler1(args)).count, 0)
    t.equals((await handler2(args)).count, 0)

    const config2 = {
      foo: 'fooValue'
    }

    t.comment('loadHandler with different config should instantiate different handler')

    const handler3 = await loadHandler(config2, builder)
    t.equals((await handler3(args)).count, 1)
  }
  {
    t.comment('jsonHandler() test')

    const builder = async config =>
      async args => {
        t.ok(args.request)
        t.equals(args.request.url, '/hello/foo')
        t.equals(args.request.method, 'GET')
        t.equals(args.request.params.userId, 'foo')
        t.equals(args.userId, 'foo')

        return {
          bar: 'baz'
        }
      }

    const config = {
      mainLogger: bunyan.createLogger({ name: 'test' })
    }

    const handler = await jsonHandler(config, builder,
      extractParam('userId'))

    const app = express()
    app.get('/hello/:userId', handler)

    const server = createServer(app)
    await listen(server, 8084)

    const response = await fetch('http://localhost:8084/hello/foo')

    t.equals(response.status, 200)
    const result = await response.json()
    t.equals(result.bar, 'baz')

    server.close()
  }
  {
    t.comment('error handler test')

    const builder = async config =>
      async args => {
        throw new Error('test error')
      }

    const config = {
      nodeEnv: 'development',
      mainLogger: bunyan.createLogger({ name: 'test' })
    }

    const handler = await jsonHandler(config, builder)

    const app = express()
    app.use(handler)
    app.use(errorHandler(config))

    const server = createServer(app)
    await listen(server, 8084)

    const response = await fetch('http://localhost:8084/hello/foo')

    t.equals(response.status, 500)

    const result = await response.json()
    t.equals(result.statusCode, 500)
    t.equals(result.message, 'test error')
    t.equals(typeof result.stack, 'string')

    server.close()
  }
  {
    t.comment('error handler test')

    const builder = async config =>
      async args => {
        throw new Error('test error')
      }

    const config = {
      nodeEnv: 'production',
      mainLogger: bunyan.createLogger({ name: 'test' })
    }

    const handler = await jsonHandler(config, builder)

    const app = express()
    app.use(handler)
    app.use(errorHandler(config))

    const server = createServer(app)
    await listen(server, 8084)

    const response = await fetch('http://localhost:8084/hello/foo')

    t.equals(response.status, 500)

    const result = await response.json()
    t.equals(result.statusCode, 500)
    t.equals(result.message, 'internal server error')
    t.notOk(result.stack)

    server.close()
  }
}
