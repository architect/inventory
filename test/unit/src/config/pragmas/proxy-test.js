let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let cwd = process.cwd()
let inventoryDefaultsPath = join(cwd, 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let testLibPath = join(cwd, 'test', 'lib')
let testLib = require(testLibPath)
let sut = join(cwd, 'src', 'config', 'pragmas', 'proxy')
let populateProxy = require(sut)

let testing = 'http://testing.site'
let staging = 'http://staging.site'
let production = 'http://production.site'
let setterPluginSetup = testLib.setterPluginSetup.bind({}, 'proxy')

test('Set up env', t => {
  t.plan(1)
  t.ok(populateProxy, '@proxy populator is present')
})

test('No @http + no @proxy returns null @proxy', t => {
  t.plan(1)
  let inventory = inventoryDefaults()
  t.equal(populateProxy({ arc: {}, inventory }), null, 'Returned null')
})

test('@proxy population', t => {
  t.plan(3)

  let arc = parse(`@http
@proxy
testing ${testing}
staging ${staging}
production ${production}
`)
  let inventory = inventoryDefaults()
  let proxy = populateProxy({ arc, inventory })
  t.equal(proxy.testing, testing, `Got back testing env: ${testing}`)
  t.equal(proxy.staging, staging, `Got back staging env: ${staging}`)
  t.equal(proxy.production, production, `Got back production env: ${production}`)
})

test('@proxy population: plugin setter', t => {
  t.plan(6)
  let proxy
  let inventory = inventoryDefaults()
  let setter = () => ({ testing, staging, production })
  inventory.plugins = setterPluginSetup(setter)

  proxy = populateProxy({ arc: { http: [] }, inventory })
  t.equal(proxy.testing, testing, `Got back testing env: ${testing}`)
  t.equal(proxy.staging, staging, `Got back staging env: ${staging}`)
  t.equal(proxy.production, production, `Got back production env: ${production}`)

  // Arc file wins
  let arc = parse(`@http
@proxy
testing http://foo
staging http://bar
production http://baz
`)
  proxy = populateProxy({ arc, inventory })
  t.equal(proxy.testing, 'http://foo', `Got back testing env: ${testing}`)
  t.equal(proxy.staging, 'http://bar', `Got back staging env: ${staging}`)
  t.equal(proxy.production, 'http://baz', `Got back production env: ${production}`)
})

test('@proxy: validation errors', t => {
  t.plan(6)
  let errors
  let inventory = inventoryDefaults()

  errors = []
  populateProxy({ arc: { proxy: [] }, inventory, errors })
  t.ok(errors.length, '@proxy without @http errored')

  let envs = [ 'testing', 'staging', 'production' ]
  let arc
  arc = parse(`@http
@proxy
${envs[1]} foo
${envs[2]} foo`)
  errors = []
  populateProxy({ arc, inventory, errors })
  t.ok(errors.length, `@proxy errors when ${envs[0]} isn't present`)

  arc = parse(`@http
@proxy
${envs[0]} foo
${envs[2]} foo`)
  errors = []
  populateProxy({ arc, inventory, errors })
  t.ok(errors.length, `@proxy errors when ${envs[1]} isn't present`)

  arc = parse(`@http
@proxy
${envs[0]} foo
${envs[1]} foo`)
  errors = []
  populateProxy({ arc, inventory, errors })
  t.ok(errors.length, `@proxy errors when ${envs[2]} isn't present`)

  arc = parse(`@http
@proxy
${envs[0]} foo
${envs[1]}
${envs[2]} foo`)
  errors = []
  populateProxy({ arc, inventory, errors })
  t.ok(errors.length, `@proxy errors with invalid setting`)

  arc = parse(`@http
@proxy
${envs[0]} http://foo
${envs[1]} https://bar
${envs[2]} ftp://lol`)
  errors = []
  populateProxy({ arc, inventory, errors })
  t.ok(errors.length, `@proxy errors with invalid setting`)
})

test('@proxy: plugin errors', t => {
  t.plan(4)
  let errors = []
  function run (returning) {
    let inventory = inventoryDefaults()
    inventory.plugins = setterPluginSetup(() => returning)
    populateProxy({ arc: { http: [] }, inventory, errors })
  }
  function check (str = 'Invalid setter return', qty = 1) {
    t.equal(errors.length, qty, str)
    console.log(errors.join('\n'))
    // Run a bunch of control tests at the top by resetting errors after asserting
    errors = []
  }

  // Control
  run({ testing, staging, production })
  t.equal(errors.length, 0, `Valid routes did not error`)

  // Errors
  run()
  check(undefined, 1)

  run({})
  check(undefined, 3)

  run({ testing })
  check(undefined, 2)
})
