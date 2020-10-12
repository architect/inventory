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
  t.plan(4)
  t.throws(() => {
    populateProxy({ arc: { proxy: [] } })
  }, '@proxy without @http throws')

  let envs = [ 'testing', 'staging', 'production' ]
  let arc
  arc = parse(`@http
@proxy
${envs[1]}
${envs[2]}`)
  t.throws(() => {
    populateProxy({ arc })
  }, `@proxy throws when ${envs[0]} isn't present`)

  arc = parse(`@http
@proxy
${envs[0]}
${envs[2]}`)
  t.throws(() => {
    populateProxy({ arc })
  }, `@proxy throws when ${envs[1]} isn't present`)

  arc = parse(`@http
@proxy
${envs[0]}
${envs[1]}`)
  t.throws(() => {
    populateProxy({ arc })
  }, `@proxy throws when ${envs[2]} isn't present`)
})
