let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'env')
let getEnv = require(sut)
let awsMock = require('aws-sdk-mock')

let app = 'an-app'
let inventory = {
  _project: { env: null },
  app,
  aws: { region: 'us-west-1' },
}
let response = { Parameters: [] }
let reset = () => {
  response.Parameters = []
  inventory._project.env = null
}

test('Set up env', t => {
  t.plan(1)
  process.env.AWS_ACCESS_KEY_ID = 'blah'
  process.env.AWS_SECRET_ACCESS_KEY = 'blah'
  t.ok(getEnv, 'Env var getter is present')
  awsMock.mock('SSM', 'getParametersByPath', function (p, callback) {
    if (response instanceof Error) callback(response)
    else callback(null, response)
  })
})

test('Do nothing', t => {
  t.plan(1)
  getEnv({}, {}, err => {
    if (err) t.fail(err)
    t.pass('Did nothing')
  })
})

test('Get nothing back', t => {
  t.plan(1)
  getEnv({ env: true }, inventory, err => {
    if (err) t.fail(err)
    let { env } = inventory._project
    t.equal(env, null, 'Project env set to null')
    t.teardown(reset)
  })
})

test('Get nothing of value back', t => {
  t.plan(3)
  response.Parameters.push({ Name: `/${app}/meh/foo`, Value: 'bar' })
  getEnv({ env: true }, inventory, err => {
    if (err) t.fail(err)
    let { env } = inventory._project
    t.equal(env.testing, null, 'Env (testing) set to null')
    t.equal(env.staging, null, 'Env (staging) set to null')
    t.equal(env.production, null, 'Env (production) set to null')
    t.teardown(reset)
  })
})

test('Get some env vars back', t => {
  t.plan(3)
  response.Parameters.push({ Name: `/${app}/testing/foo`, Value: 'bar' })
  getEnv({ env: true }, inventory, err => {
    if (err) t.fail(err)
    let { env } = inventory._project
    t.deepEqual(env.testing, { foo: 'bar' }, 'Env (testing) env vars populated')
    t.equal(env.staging, null, 'Env (staging) set to null')
    t.equal(env.production, null, 'Env (production) set to null')
    t.teardown(reset)
  })
})

test('Get all env vars back', t => {
  t.plan(3)
  response.Parameters.push(
    { Name: `/${app}/testing/foo`, Value: 'bar' },
    { Name: `/${app}/staging/foo`, Value: 'baz' },
    { Name: `/${app}/production/foo`, Value: 'buz' },
  )
  getEnv({ env: true }, inventory, err => {
    if (err) t.fail(err)
    let { env } = inventory._project
    t.deepEqual(env.testing, { foo: 'bar' }, 'Env (testing) env vars populated')
    t.deepEqual(env.staging, { foo: 'baz' }, 'Env (staging) env vars populated')
    t.deepEqual(env.production, { foo: 'buz' }, 'Env (production) env vars populated')
    t.teardown(reset)
  })
})

test('Error handling', t => {
  t.plan(1)
  let msg = 'some error'
  response = Error(msg)
  getEnv({ env: true }, inventory, err => {
    if (err) t.equal(err.message, msg, 'Called back with SSM error')
    else t.fail('Expected an error')
    t.teardown(reset)
  })
})

test('Teardown', t => {
  t.plan(1)
  awsMock.restore()
  delete process.env.AWS_ACCESS_KEY_ID
  delete process.env.AWS_SECRET_ACCESS_KEY
  t.pass('All done')
})
