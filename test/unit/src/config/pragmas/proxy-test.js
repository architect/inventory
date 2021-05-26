let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'proxy')
let populateProxy = require(sut)

test('Set up env', t => {
  t.plan(1)
  t.ok(populateProxy, '@proxy populator is present')
})

test('No @http + no @proxy returns null @proxy', t => {
  t.plan(1)
  t.equal(populateProxy({ arc: {} }), null, 'Returned null')
})

test('@proxy population', t => {
  t.plan(3)

  let testing = 'http://testing.site'
  let staging = 'http://staging.site'
  let production = 'http://production.site'

  let arc = parse(`@http
@proxy
testing ${testing}
staging ${staging}
production ${production}
`)
  let proxy = populateProxy({ arc })
  t.equal(proxy.testing, testing, `Got back testing env: ${testing}`)
  t.equal(proxy.staging, staging, `Got back staging env: ${staging}`)
  t.equal(proxy.production, production, `Got back production env: ${production}`)
})

test('@proxy errors', t => {
  t.plan(5)
  let errors

  errors = []
  populateProxy({ arc: { proxy: [] }, errors })
  t.ok(errors.length, '@proxy without @http errored')

  let envs = [ 'testing', 'staging', 'production' ]
  let arc
  arc = parse(`@http
@proxy
${envs[1]} foo
${envs[2]} foo`)
  errors = []
  populateProxy({ arc, errors })
  t.ok(errors.length, `@proxy errors when ${envs[0]} isn't present`)

  arc = parse(`@http
@proxy
${envs[0]} foo
${envs[2]} foo`)
  errors = []
  populateProxy({ arc, errors })
  t.ok(errors.length, `@proxy errors when ${envs[1]} isn't present`)

  arc = parse(`@http
@proxy
${envs[0]} foo
${envs[1]} foo`)
  errors = []
  populateProxy({ arc, errors })
  t.ok(errors.length, `@proxy errors when ${envs[2]} isn't present`)

  arc = parse(`@http
@proxy
${envs[0]} foo
${envs[1]}
${envs[2]} foo`)
  errors = []
  populateProxy({ arc, errors })
  t.ok(errors.length, `@proxy errors with invalid setting`)
})
