let { join } = require('path')
let mockTmp = require('mock-tmp')
let test = require('tape')
let cwd = process.cwd()
let _defaults = join(cwd, 'src', 'defaults')
let defaultConfig = require(_defaults)
let sut = join(cwd, 'src', 'config', 'pragmas', 'populate-lambda')
let populateLambda = require(sut)

let name = 'an-event'
let src = join('proj', 'src', 'fn')

test('Set up env', t => {
  t.plan(2)
  t.ok(populateLambda, 'Lambda populator is present')
  t.ok(defaultConfig, 'Default config is present')
})

test('Do nothing', t => {
  t.plan(4)
  let result
  let arc = {}
  let inventory = defaultConfig()
  let errors = []

  result = populateLambda.events({ arc, inventory, errors })
  t.equal(result, null, 'Returned null pragma')
  t.notOk(errors.length, 'No errors returned')

  arc.events = []
  result = populateLambda.events({ arc, inventory, errors })
  t.equal(result, null, 'Returned null pragma')
  t.notOk(errors.length, 'No errors returned')
})

test('Populate Lambdas (via manifest)', t => {
  t.plan(27)
  let arc, inventory, errors, result

  function check (item) {
    t.notOk(errors.length, 'No errors returned')
    t.equal(item.name, name, 'Returned proper Lambda')
    t.equal(item.src, join(cwd, 'src', 'events', 'an-event'), 'Returned correct source path')
    t.notOk(item.plugin, 'Lambda does not have a plugin name')
    t.notOk(item.type, 'Lambda not identified as having been created by a plugin')
    t.notOk(item.build, 'Build property not set')
    t.ok(item.config.shared, 'config.shared is true')
    t.equal(item.config.views, undefined, 'config.views is undefined (not http)')
  }

  // The normal case: @pragma
  arc = { events: [ name ] }
  inventory = defaultConfig()
  errors = []
  result = populateLambda.events({ arc, inventory, errors })
  t.equal(result.length, 1, 'Returned a Lambda')
  check(result[0])

  // Ensure src slashes are normalized
  arc = { events: [ { [name]: { src: `src\\events/an-event` } } ] }
  inventory = defaultConfig()
  errors = []
  result = populateLambda.events({ arc, inventory, errors })
  t.equal(result.length, 1, 'Returned a Lambda')
  check(result[0])

  // Special case: one pragma populates another
  // e.g. @tables populating inv['tables-streams']
  arc = {}
  inventory = defaultConfig()
  errors = []
  result = populateLambda.events({ arc, inventory, errors, pragma: [ name ] })
  t.equal(result.length, 1, 'Returned a Lambda')
  check(result[0])
})

test('Populate Lambdas (manifest vs. plugin conflict resolution)', t => {
  t.plan(16)
  let arc, errors, inventory, result
  let fn = () => ({ name, src })
  let fnOverride = () => ({ name, src: 'foo', required: true })
  fn._plugin = fnOverride._plugin = 'plugin-name'
  fn._type = fnOverride._type = 'plugin'

  // Arc + set plugins result in conflicting plugin Lambda removed when `required` property is NOT set
  errors = []
  arc = { events: [ name ] }
  inventory = defaultConfig()
  inventory.plugins = { _methods: { set: { events: [ fn ] } } }
  result = populateLambda.events({ arc, inventory, errors })
  t.notOk(errors.length, 'No errors returned')
  t.equal(result.length, 1, 'Returned 1 Lambda')
  t.equal(result[0].name, name, 'Lambda has conflicting name')
  t.ok(!result[0].src.includes('foo'), 'Lambda has correct src path')
  t.notOk(result[0]._plugin, 'Lambda _plugin property not found')
  t.notOk(result[0].required, 'Lambda required property not found')

  // Arc + set plugin result in multiple conflicting lambdas when `required` property IS set
  // (This will later throw a conflict error)
  errors = []
  arc = { events: [ name ] }
  inventory = defaultConfig()
  inventory.plugins = { _methods: { set: { events: [ fnOverride ] } } }
  result = populateLambda.events({ arc, inventory, errors })
  t.notOk(errors.length, 'No errors returned')
  t.equal(result.length, 2, 'Returned 2 Lambdas')
  // Plugin Lambda
  t.equal(result[0].name, name, 'Lambda has conflicting name')
  t.ok(result[0].src.includes('foo'), 'Lambda has correct src path')
  t.ok(result[0]._plugin, 'Lambda _plugin property found')
  t.ok(result[0].required, 'Lambda required property found')
  // Arc Lambda
  t.equal(result[1].name, name, 'Lambda has conflicting name')
  t.ok(!result[1].src.includes('foo'), 'Lambda has correct src path')
  t.notOk(result[1]._plugin, 'Lambda _plugin property not found')
  t.notOk(result[1].required, 'Lambda required property not found')
})

test('Populate Lambdas (via plugin)', t => {
  t.plan(88)
  let arc = {}, errors = [], inventory = defaultConfig(), result
  let returning = { name, src }
  let fn = () => (returning)
  let fn2x = () => ([ returning, returning ])
  fn._plugin = fn2x._plugin = 'plugin-name'
  fn._type = fn2x._type = 'plugin'
  inventory._project.build = 'uh-oh'
  function check (item, compiled, absoluteSrc) {
    t.notOk(errors.length, 'No errors returned')
    t.equal(item.name, name, 'Returned proper Lambda')
    t.equal(item.src, absoluteSrc || join(cwd, src), 'Returned correct source path')
    t.equal(item.plugin, fn.plugin, 'Lambda identified by plugin name')
    t.equal(item.type, fn.type, 'Lambda identified as having been created by a plugin')
    if (!compiled) {
      t.notOk(item.build, 'Build property not set')
      t.ok(item.config.shared, 'config.shared is true')
      t.equal(item.config.views, undefined, 'config.views is undefined (not http)')
    }
    else {
      t.ok(item.build, 'Build property set')
      t.equal(item.config.shared, false, 'config.shared is false')
      t.equal(item.config.views, false, 'config.views is false')
    }
    inventory = defaultConfig()
    errors = []
  }

  // One setter, one Lambda
  inventory.plugins = { _methods: { set: { events: [ fn ] } } }
  result = populateLambda.events({ arc, inventory, errors })
  t.equal(result.length, 1, 'Returned a Lambda')
  check(result[0])

  // ... same, but ensure src slashes are normalized
  returning.src = `proj\\src/fn`
  inventory.plugins = { _methods: { set: { events: [ fn ] } } }
  result = populateLambda.events({ arc, inventory, errors })
  t.equal(result.length, 1, 'Returned a Lambda')
  check(result[0])
  returning.src = src

  // One setter, using absolute paths
  returning.src = join(process.cwd(), 'foo', 'bar')
  inventory.plugins = { _methods: { set: { events: [ fn ] } } }
  result = populateLambda.events({ arc, inventory, errors })
  t.equal(result.length, 1, 'Returned a Lambda')
  check(result[0], null, returning.src)
  returning.src = src

  // One setter, multiple Lambdas
  inventory.plugins = { _methods: { set: { events: [ fn2x ] } } }
  result = populateLambda.events({ arc, inventory, errors })
  t.equal(result.length, 2, 'Returned two Lambdas')
  check(result[0])
  check(result[1])

  // Multiple setters, multiple Lambdas
  inventory.plugins = { _methods: { set: { events: [ fn, fn ] } } }
  result = populateLambda.events({ arc, inventory, errors })
  t.equal(result.length, 2, 'Returned two Lambdas')
  check(result[0])
  check(result[1])

  // Setter is compiled
  returning.build = join('proj', 'build')
  returning.config = { runtime: 'rust' }
  inventory._project.customRuntimes = { rust: { type: 'compiled' } }
  inventory.plugins = { _methods: { set: { events: [ fn ] } } }
  result = populateLambda.events({ arc, inventory, errors })
  t.equal(result.length, 1, 'Returned a Lambda')
  check(result[0], true)

  // Setter is transpiled
  returning.config = { runtime: 'typescript' }
  inventory._project.customRuntimes = { typescript: { type: 'transpiled' } }
  inventory.plugins = { _methods: { set: { events: [ fn ] } } }
  result = populateLambda.events({ arc, inventory, errors })
  t.equal(result.length, 1, 'Returned a Lambda')
  check(result[0], true)

  // Populate regular Lambda with custom runtime
  // We don't need to exercise the entirety of the effects of custom runtimes; just ensure that the configuration ensures the build property is set
  inventory.plugins = null
  inventory._project.build = join('proj', 'build')
  inventory._project.customRuntimes = { typescript: { type: 'transpiled' } }
  inventory._project.defaultFunctionConfig.runtime = 'typescript'
  arc = { events: [ name ] }
  errors = []
  result = populateLambda.events({ arc, inventory, errors })
  t.equal(result.length, 1, 'Returned a Lambda')
  t.notOk(errors.length, 'No errors returned')
  t.equal(result[0].name, name, 'Returned proper Lambda')
  t.equal(result[0].src, join(cwd, 'src', 'events', 'an-event'), 'Returned correct source path')
  t.notOk(result[0].plugin, 'Lambda not identified by plugin name')
  t.notOk(result[0].type, 'Lambda not identified as having been created by a plugin')
  t.equal(result[0].build, join(inventory._project.build, 'events', 'an-event'), 'Build property set')
  t.equal(result[0].config.shared, false, 'config.shared is false')
  t.equal(result[0].config.views, false, 'config.views is false')
  inventory = defaultConfig()
})

test('Plugin population errors', t => {
  t.plan(26)
  let arc = {}, errors = [], inventory = defaultConfig(), fn, result
  function rtn (item) {
    fn = () => (item)
    fn._plugin = 'plugin-name'
    fn._type = 'plugin'
    inventory.plugins = { _methods: { set: { events: [ fn ] } } }
  }
  function check () {
    if (errors.length) console.log(errors[0])
    t.equal(errors.length, 1, 'Returned an error')
    t.match(errors[0], /Setter plugins/, 'Got a setter plugin error')
    t.match(errors[0], /plugin: plugin-name/, 'Got a setter plugin error')
    t.match(errors[0], /method: set\.events/, 'Got a setter plugin error')
    t.notOk(result, 'No result returned')
    errors = []
  }

  // String
  rtn('hi')
  result = populateLambda.events({ arc, inventory, errors })
  check()

  // Number
  rtn(123)
  result = populateLambda.events({ arc, inventory, errors })
  check()

  // Bool
  rtn(true)
  result = populateLambda.events({ arc, inventory, errors })
  check()

  // Function
  rtn(() => {})
  result = populateLambda.events({ arc, inventory, errors })
  check()

  // Falsy
  rtn(undefined)
  result = populateLambda.events({ arc, inventory, errors })
  check()

  // Fail immediately upon setter exception
  fn = params => params.hi.there
  fn._plugin = 'plugin-name'
  fn._type = 'plugin'
  inventory.plugins = { _methods: { set: { events: [ fn ] } } }
  t.throws(() => {
    populateLambda.events({ arc, inventory, errors })
  }, /Setter plugin exception/, 'Failing setter threw')
})

test('Per-function AWS/ARC config (including custom handlers)', t => {
  t.plan(13)
  let arc, config, cwd, errors, inventory, lambdas, modified
  let configPath = 'src/events/configured-event/config.arc'

  // Node.js default
  config = `@aws
timeout 10
memory 128

@arc
custom setting
`

  cwd = mockTmp({ [configPath]: config })
  inventory = defaultConfig({ cwd })
  inventory.events = [
    'unconfigured-event',
    'configured-event',
  ]
  arc = { events: inventory.events }
  errors = []
  lambdas = populateLambda.events({ arc, inventory, errors })
  t.deepEqual(lambdas[0].config, inventory._project.defaultFunctionConfig, 'Config was unmodified')
  modified = {
    timeout: 10,
    memory: 128,
    runtime: `nodejs16.x`,
    handler: 'index.handler',
    custom: 'setting',
  }
  t.deepEqual(lambdas[1].config, { ...inventory._project.defaultFunctionConfig, ...modified }, 'Config was correctly upserted')
  t.notOk(errors.length, 'No errors returned')
  mockTmp.restore()

  // Node.js custom configured handler
  config = `@aws
timeout 10
memory 128
handler lambda.handler

@arc
custom setting
`
  cwd = mockTmp({ [configPath]: config })
  inventory = defaultConfig({ cwd })
  errors = []
  lambdas = populateLambda.events({ arc, inventory, errors })
  t.deepEqual(lambdas[0].config, inventory._project.defaultFunctionConfig, 'Config was unmodified')
  modified = {
    timeout: 10,
    memory: 128,
    runtime: `nodejs16.x`,
    handler: 'lambda.handler',
    custom: 'setting',
  }
  t.deepEqual(lambdas[1].config, { ...inventory._project.defaultFunctionConfig, ...modified }, 'Config was correctly upserted')
  t.notOk(errors.length, 'No errors returned')
  mockTmp.restore()

  // Python
  config = `@aws
timeout 10
memory 128
runtime python3.8

@arc
custom setting
`
  cwd = mockTmp({ [configPath]: config })
  inventory = defaultConfig({ cwd })
  errors = []
  lambdas = populateLambda.events({ arc, inventory, errors })
  t.deepEqual(lambdas[0].config, inventory._project.defaultFunctionConfig, 'Config was unmodified')
  modified = {
    timeout: 10,
    memory: 128,
    runtime: `python3.8`,
    handler: 'lambda.handler',
    custom: 'setting',
  }
  t.deepEqual(lambdas[1].config, { ...inventory._project.defaultFunctionConfig, ...modified }, 'Config was correctly upserted')
  t.notOk(errors.length, 'No errors returned')
  mockTmp.restore()

  // Ruby
  config = `@aws
timeout 10
memory 128
runtime ruby2.7

@arc
custom setting
`
  cwd = mockTmp({ [configPath]: config })
  inventory = defaultConfig({ cwd })
  errors = []
  lambdas = populateLambda.events({ arc, inventory, errors })
  t.deepEqual(lambdas[0].config, inventory._project.defaultFunctionConfig, 'Config was unmodified')
  modified = {
    timeout: 10,
    memory: 128,
    runtime: `ruby2.7`,
    handler: 'lambda.handler',
    custom: 'setting',
  }
  t.deepEqual(lambdas[1].config, { ...inventory._project.defaultFunctionConfig, ...modified }, 'Config was correctly upserted')
  t.notOk(errors.length, 'No errors returned')
  mockTmp.restore()

  // Now return a Lambda config error
  config = `lolidk`
  cwd = mockTmp({ [configPath]: config })
  inventory = defaultConfig({ cwd })
  lambdas = populateLambda.events({ arc, inventory, errors })
  t.equal(errors.length, 1, `Invalid Lambda config returned error: ${errors[0]}`)
  mockTmp.restore()
})
