let { join } = require('path')
let test = require('tape')
let proxyquire = require('proxyquire')

async function awsLite () {
  return { ssm: {
    GetParametersByPath: async () => {
      if (response instanceof Error) throw response
      return response
    }
  } }
}

let sut = join(process.cwd(), 'src', 'env')
let getEnv = proxyquire(sut, {
  '@aws-lite/client': awsLite
})

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

test('Set up env', t => {
  t.plan(1)
  t.ok(getEnv, 'Env var getter is present')
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
    let { aws } = inventory._project.env
    t.deepEqual(aws, nulls, 'AWS envs set to null')
    t.teardown(reset)
  })
})

test('Get nothing of value back', t => {
  t.plan(1)
  response.Parameters.push({ Name: `/${app}/meh/foo`, Value: 'bar' })
  getEnv({ env: true }, inventory, err => {
    if (err) t.fail(err)
    let { aws } = inventory._project.env
    t.deepEqual(aws, nulls, 'AWS envs set to null')
    t.teardown(reset)
  })
})

test('Get some env vars back', t => {
  t.plan(3)
  response.Parameters.push({ Name: `/${app}/testing/foo`, Value: 'bar' })
  getEnv({ env: true }, inventory, err => {
    if (err) t.fail(err)
    let { aws } = inventory._project.env
    t.deepEqual(aws.testing, { foo: 'bar' }, `AWS 'testing' env vars populated`)
    t.equal(aws.staging, null, `AWS 'staging' set to null`)
    t.equal(aws.production, null, `AWS 'production' set to null`)
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
    let { aws } = inventory._project.env
    t.deepEqual(aws.testing, { foo: 'bar' }, `AWS 'testing' env vars populated`)
    t.deepEqual(aws.staging, { foo: 'baz' }, `AWS 'staging' env vars populated`)
    t.deepEqual(aws.production, { foo: 'buz' }, `AWS 'production' env vars populated`)
    t.teardown(reset)
  })
})

test('SSM env vars do not conflict with plugin env vars', t => {
  let inventory, ok = { idk: ':shruggie:' }

  t.test('Plugin env vars but nothing from SSM', t => {
    t.plan(1)
    let plugins = {
      testing: ok,
      staging: ok,
      production: ok,
    }
    inventory = newInv(plugins)
    getEnv({ env: true }, inventory, err => {
      if (err) t.fail(err)
      let { aws } = inventory._project.env
      t.deepEqual(aws, plugins, `AWS env vars populated`)
      t.teardown(reset)
    })
  })

  t.test('Partial SSM + plugin merge (testing)', t => {
    t.plan(3)
    inventory = newInv({
      testing: ok,
    })
    response.Parameters.push(
      { Name: `/${app}/testing/foo`, Value: 'a' },
      { Name: `/${app}/production/baz`, Value: 'c' },
    )
    getEnv({ env: true }, inventory, err => {
      if (err) t.fail(err)
      let { aws } = inventory._project.env
      t.deepEqual(aws.testing, { ...ok, foo: 'a' }, 'Env (testing) env vars populated')
      t.deepEqual(aws.staging, null, 'Env (staging) env vars null')
      t.deepEqual(aws.production, { baz: 'c' }, 'Env (production) env vars populated')
      t.teardown(reset)
    })
  })

  t.test('Partial SSM + plugin merge (staging)', t => {
    t.plan(3)
    inventory = newInv({
      staging: ok,
    })
    response.Parameters.push(
      { Name: `/${app}/testing/foo`, Value: 'a' },
      { Name: `/${app}/staging/bar`, Value: 'b' },
    )
    getEnv({ env: true }, inventory, err => {
      if (err) t.fail(err)
      let { aws } = inventory._project.env
      t.deepEqual(aws.testing, { foo: 'a' }, 'Env (testing) env vars populated')
      t.deepEqual(aws.staging, { ...ok, bar: 'b' }, 'Env (staging) env vars populated')
      t.equal(aws.production, null, 'Env (production) env vars are null')
      t.teardown(reset)
    })
  })

  t.test('Partial SSM + plugin merge (production)', t => {
    t.plan(3)
    inventory = newInv({
      production: ok,
    })
    response.Parameters.push(
      { Name: `/${app}/staging/bar`, Value: 'b' },
      { Name: `/${app}/production/baz`, Value: 'c' },
    )
    getEnv({ env: true }, inventory, err => {
      if (err) t.fail(err)
      let { aws } = inventory._project.env
      t.deepEqual(aws.testing, null, 'Env (testing) env vars are null')
      t.deepEqual(aws.staging, { bar: 'b' }, 'Env (staging) env vars populated')
      t.deepEqual(aws.production, { ...ok, baz: 'c' }, 'Env (production) env vars are populated')
      t.teardown(reset)
    })
  })

  t.test('Full SSM + plugin merge', t => {
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
    getEnv({ env: true }, inventory, err => {
      if (err) t.fail(err)
      let { aws } = inventory._project.env
      t.deepEqual(aws.testing, { ...ok, foo: 'a' }, 'Env (testing) env vars populated')
      t.deepEqual(aws.staging, { ...ok, bar: 'b' }, 'Env (staging) env vars populated')
      t.deepEqual(aws.production, { ...ok, baz: 'c' }, 'Env (production) env vars populated')
      t.teardown(reset)
    })
  })
})

test('SSM env vars conflict with plugin env vars', t => {
  let inventory

  t.test('Partial SSM + plugin merge failure', t => {
    t.plan(2)
    inventory = newInv({
      testing: { foo: 'idk' }
    })
    response.Parameters.push(
      { Name: `/${app}/testing/foo`, Value: 'a' },
      { Name: `/${app}/staging/bar`, Value: 'b' },
      { Name: `/${app}/production/baz`, Value: 'c' },
    )
    getEnv({ env: true }, inventory, err => {
      if (!err) t.fail('Expected error')
      t.match(err.message, /'testing' variable 'foo'/, 'Got back testing env var conflict error')
      t.doesNotMatch(err.message, /(staging)|(production)/, 'Did not get back staging/prod env var conflict error')
      t.teardown(reset)
    })
  })

  t.test('Total SSM + plugin merge failure', t => {
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
    getEnv({ env: true }, inventory, err => {
      if (!err) t.fail('Expected error')
      t.match(err.message, /'testing' variable 'foo'/, 'Got back testing env var conflict error')
      t.match(err.message, /'staging' variable 'bar'/, 'Got back testing env var conflict error')
      t.match(err.message, /'production' variable 'baz'/, 'Got back testing env var conflict error')
      t.teardown(reset)
    })
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
  t.pass('All done')
})
