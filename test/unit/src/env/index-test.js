let { test } = require('node:test')
let awsLite = require('@aws-lite/client')
let getEnv = require('../../../../src/env')

let app = 'an-app'
let nulls = {
  testing: null,
  staging: null,
  production: null,
}
let noEnv = {
  local: nulls,
  plugins: nulls,
  aws: nulls,
}
let newInv = (plugins) => {
  let env
  if (plugins) env = {
    local: nulls,
    plugins: JSON.parse(JSON.stringify(plugins)),
    aws: nulls,
  }
  else env = noEnv
  return {
    _project: { env },
    app,
    aws: { region: 'us-west-1' },
  }
}
let inventory = newInv()
let response = { Parameters: [] }
let reset = () => {
  response.Parameters = []
  inventory = newInv()
}

test.before(() => {
  awsLite.testing.enable()
})
test.beforeEach(reset)
test.after(() => {
  awsLite.testing.disable()
})

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(getEnv, 'Env var getter is present')
})

test('Do nothing', (t, done) => {
  t.plan(1)
  getEnv({}, {}, err => {
    if (err) t.assert.fail(err)
    t.assert.ok(true, 'Did nothing')
    done()
  })
})

test('Get nothing back', (t, done) => {
  t.plan(1)
  awsLite.testing.mock('SSM.GetParametersByPath', response)
  getEnv({ env: true }, inventory, err => {
    if (err) t.assert.fail(err)
    let { aws } = inventory._project.env
    t.assert.deepEqual(aws, nulls, 'AWS envs set to null')
    done()
  })
})

test('Get nothing of value back', (t, done) => {
  t.plan(1)
  response.Parameters.push({ Name: `/${app}/meh/foo`, Value: 'bar' })
  awsLite.testing.mock('SSM.GetParametersByPath', response)
  getEnv({ env: true }, inventory, err => {
    if (err) t.assert.fail(err)
    let { aws } = inventory._project.env
    t.assert.deepEqual(aws, nulls, 'AWS envs set to null')
    done()
  })
})

test('Get some env vars back', (t, done) => {
  t.plan(3)
  response.Parameters.push({ Name: `/${app}/testing/foo`, Value: 'bar' })
  awsLite.testing.mock('SSM.GetParametersByPath', response)
  getEnv({ env: true }, inventory, err => {
    if (err) t.assert.fail(err)
    let { aws } = inventory._project.env
    t.assert.deepEqual(aws.testing, { foo: 'bar' }, `AWS 'testing' env vars populated`)
    t.assert.equal(aws.staging, null, `AWS 'staging' set to null`)
    t.assert.equal(aws.production, null, `AWS 'production' set to null`)
    done()
  })
})

test('Get all env vars back', (t, done) => {
  t.plan(3)
  response.Parameters.push(
    { Name: `/${app}/testing/foo`, Value: 'bar' },
    { Name: `/${app}/staging/foo`, Value: 'baz' },
    { Name: `/${app}/production/foo`, Value: 'buz' },
  )
  awsLite.testing.mock('SSM.GetParametersByPath', response)
  getEnv({ env: true }, inventory, err => {
    if (err) t.assert.fail(err)
    let { aws } = inventory._project.env
    t.assert.deepEqual(aws.testing, { foo: 'bar' }, `AWS 'testing' env vars populated`)
    t.assert.deepEqual(aws.staging, { foo: 'baz' }, `AWS 'staging' env vars populated`)
    t.assert.deepEqual(aws.production, { foo: 'buz' }, `AWS 'production' env vars populated`)
    done()
  })
})

test('SSM env vars do not conflict with plugin env vars', async t => {
  let inventory, ok = { idk: ':shruggie:' }

  await t.test('Plugin env vars but nothing from SSM', (t, done) => {
    t.plan(1)
    let plugins = {
      testing: ok,
      staging: ok,
      production: ok,
    }
    awsLite.testing.mock('SSM.GetParametersByPath', response)
    inventory = newInv(plugins)
    getEnv({ env: true }, inventory, err => {
      if (err) t.assert.fail(err)
      let { aws } = inventory._project.env
      t.assert.deepEqual(aws, plugins, `AWS env vars populated`)
      done()
    })
  })

  await t.test('Partial SSM + plugin merge (testing)', (t, done) => {
    t.plan(3)
    inventory = newInv({
      testing: ok,
    })
    response.Parameters.push(
      { Name: `/${app}/testing/foo`, Value: 'a' },
      { Name: `/${app}/production/baz`, Value: 'c' },
    )
    awsLite.testing.mock('SSM.GetParametersByPath', response)
    getEnv({ env: true }, inventory, err => {
      if (err) t.assert.fail(err)
      let { aws } = inventory._project.env
      t.assert.deepEqual(aws.testing, { ...ok, foo: 'a' }, 'Env (testing) env vars populated')
      t.assert.deepEqual(aws.staging, null, 'Env (staging) env vars null')
      t.assert.deepEqual(aws.production, { baz: 'c' }, 'Env (production) env vars populated')
      done()
    })
  })

  await t.test('Partial SSM + plugin merge (staging)', (t, done) => {
    t.plan(3)
    inventory = newInv({
      staging: ok,
    })
    response.Parameters.push(
      { Name: `/${app}/testing/foo`, Value: 'a' },
      { Name: `/${app}/staging/bar`, Value: 'b' },
    )
    awsLite.testing.mock('SSM.GetParametersByPath', response)
    getEnv({ env: true }, inventory, err => {
      if (err) t.assert.fail(err)
      let { aws } = inventory._project.env
      t.assert.deepEqual(aws.testing, { foo: 'a' }, 'Env (testing) env vars populated')
      t.assert.deepEqual(aws.staging, { ...ok, bar: 'b' }, 'Env (staging) env vars populated')
      t.assert.equal(aws.production, null, 'Env (production) env vars are null')
      done()
    })
  })

  await t.test('Partial SSM + plugin merge (production)', (t, done) => {
    t.plan(3)
    inventory = newInv({
      production: ok,
    })
    response.Parameters.push(
      { Name: `/${app}/staging/bar`, Value: 'b' },
      { Name: `/${app}/production/baz`, Value: 'c' },
    )
    awsLite.testing.mock('SSM.GetParametersByPath', response)
    getEnv({ env: true }, inventory, err => {
      if (err) t.assert.fail(err)
      let { aws } = inventory._project.env
      t.assert.deepEqual(aws.testing, null, 'Env (testing) env vars are null')
      t.assert.deepEqual(aws.staging, { bar: 'b' }, 'Env (staging) env vars populated')
      t.assert.deepEqual(aws.production, { ...ok, baz: 'c' }, 'Env (production) env vars are populated')
      done()
    })
  })

  await t.test('Full SSM + plugin merge', (t, done) => {
    t.plan(3)
    inventory = newInv({
      testing: ok,
      staging: ok,
      production: ok,
    })
    response.Parameters.push(
      { Name: `/${app}/testing/foo`, Value: 'a' },
      { Name: `/${app}/staging/bar`, Value: 'b' },
      { Name: `/${app}/production/baz`, Value: 'c' },
    )
    awsLite.testing.mock('SSM.GetParametersByPath', response)
    getEnv({ env: true }, inventory, err => {
      if (err) t.assert.fail(err)
      let { aws } = inventory._project.env
      t.assert.deepEqual(aws.testing, { ...ok, foo: 'a' }, 'Env (testing) env vars populated')
      t.assert.deepEqual(aws.staging, { ...ok, bar: 'b' }, 'Env (staging) env vars populated')
      t.assert.deepEqual(aws.production, { ...ok, baz: 'c' }, 'Env (production) env vars populated')
      done()
    })
  })
})

test('SSM env vars conflict with plugin env vars', async t => {
  let inventory

  await t.test('Partial SSM + plugin merge failure', (t, done) => {
    t.plan(2)
    inventory = newInv({
      testing: { foo: 'idk' },
    })
    response.Parameters.push(
      { Name: `/${app}/testing/foo`, Value: 'a' },
      { Name: `/${app}/staging/bar`, Value: 'b' },
      { Name: `/${app}/production/baz`, Value: 'c' },
    )
    awsLite.testing.mock('SSM.GetParametersByPath', response)
    getEnv({ env: true }, inventory, err => {
      if (!err) t.assert.fail('Expected error')
      t.assert.match(err.message, /'testing' variable 'foo'/, 'Got back testing env var conflict error')
      t.assert.doesNotMatch(err.message, /(staging)|(production)/, 'Did not get back staging/prod env var conflict error')
      done()
    })
  })

  await t.test('Total SSM + plugin merge failure', (t, done) => {
    t.plan(3)
    inventory = newInv({
      testing: { foo: 'a' },
      staging: { bar: 'a' },
      production: { baz: 'a' },
    })
    response.Parameters.push(
      { Name: `/${app}/testing/foo`, Value: 'a' },
      { Name: `/${app}/staging/bar`, Value: 'b' },
      { Name: `/${app}/production/baz`, Value: 'c' },
    )
    awsLite.testing.mock('SSM.GetParametersByPath', response)
    getEnv({ env: true }, inventory, err => {
      if (!err) t.assert.fail('Expected error')
      t.assert.match(err.message, /'testing' variable 'foo'/, 'Got back testing env var conflict error')
      t.assert.match(err.message, /'staging' variable 'bar'/, 'Got back testing env var conflict error')
      t.assert.match(err.message, /'production' variable 'baz'/, 'Got back testing env var conflict error')
      done()
    })
  })
})

test('Error handling', (t, done) => {
  t.plan(1)
  let msg = 'some error'
  awsLite.testing.mock('SSM.GetParametersByPath', { error: msg })
  getEnv({ env: true }, inventory, err => {
    if (err) t.assert.match(err.message, new RegExp(msg), 'Called back with SSM error')
    else t.assert.fail('Expected an error')
    done()
  })
})
