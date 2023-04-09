let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', 'project', 'plugins', 'runtimes')
let setRuntimesPlugins = require(sut)

let name = 'custom-runtime'
let name2 = 'another-custom-runtime'
let pluginName = 'a-plugin'
let pluginName2 = 'another-plugin'

let emptyProj = { arc: {} }
let newInv = (runtimes = { plugins: null }) => {
  return {
    plugins: { _methods: { set: { runtimes } } },
  }
}

test('Set up env', t => {
  t.plan(1)
  t.ok(setRuntimesPlugins, 'Custom runtime plugin setter module is present')
})

test('Do nothing if no runtime setter plugins are present', t => {
  t.plan(2)
  let errors = []
  let inventory = newInv()
  let plugins = setRuntimesPlugins({ inventory, errors })
  t.notOk(errors.length, 'Did not return errors')
  t.deepEqual(plugins, {}, 'Returned empty object')
})

test('Basic runtime setter plugins', t => {
  t.plan(18)
  let inventory, plugin, plugins, runtime, runtime2
  let type = 'interpreted'
  let errors = []

  // Plugin gets the args and props it expects
  runtime = { name, type }
  errors = []
  plugin = function (params) {
    t.ok(params, 'Plugin function called and received params with Inventory')
    t.deepEqual(params, { arc: {}, inventory: { inv: inventory } }, 'Inventory is partial, containing the current default inventory + partially built project')
    return runtime
  }
  inventory = newInv([ plugin ])
  inventory._project = { arc: {}, cwd: 'hi' }
  plugins = setRuntimesPlugins({ inventory, errors }, inventory._project)

  // Return a single custom runtime
  plugin = () => runtime
  plugin._plugin = pluginName
  inventory = newInv([ plugin ])
  plugins = setRuntimesPlugins({ inventory, errors }, emptyProj)
  t.notOk(errors.length, 'Did not return errors')
  t.notOk(plugins.build, 'Did not return build property')
  t.equal(plugins.runtimes.runtimes.length, 1, 'Returned single runtime')
  t.equal(plugins.runtimes.runtimes[0], name, 'Returned correct runtime name')
  t.equal(plugins.runtimes[name].name, name, 'Returned populated custom runtime object')
  t.deepEqual(plugins.runtimes[name], runtime, 'Returned populated custom runtime object')
  t.equal(plugins.runtimes.runtimePlugins[name], pluginName, 'Returned correct runtime plugin map')

  // Return multiple custom runtimes
  runtime2 = { name: name2, type }
  plugin = () => [ runtime, runtime2 ]
  plugin._plugin = pluginName2
  inventory = newInv([ plugin ])
  plugins = setRuntimesPlugins({ inventory, errors }, emptyProj)
  t.notOk(errors.length, 'Did not return errors')
  t.notOk(plugins.build, 'Did not return build property')
  t.equal(plugins.runtimes.runtimes.length, 2, 'Returned two runtimes')
  t.equal(plugins.runtimes.runtimes[0], name, 'Returned correct runtime name')
  t.deepEqual(plugins.runtimes[name], runtime, 'Returned populated custom runtime object')
  t.equal(plugins.runtimes.runtimes[1], name2, 'Returned correct runtime name')
  t.deepEqual(plugins.runtimes[name2], runtime2, 'Returned populated custom runtime object')
  t.equal(plugins.runtimes.runtimePlugins[name], pluginName2, 'Returned populated custom runtime object')
  t.equal(plugins.runtimes.runtimePlugins[name2], pluginName2, 'Returned populated custom runtime object')
})

test('Transpiled runtime setters', t => {
  t.plan(10)
  let inventory, plugin, plugins, runtime
  let type = 'transpiled'
  let build = '.build' // Just make sure it's different from the default 'build'
  let baseRuntime = 'nodejs14.x'
  let errors = []

  // Transpiled with default build dir
  runtime = { name, type, baseRuntime }
  plugin = () => runtime
  inventory = newInv([ plugin ])
  plugins = setRuntimesPlugins({ inventory, errors }, emptyProj)
  t.notOk(errors.length, 'Did not return errors')
  t.equal(plugins.build, 'build', 'Returned default build property')
  t.equal(plugins.runtimes.runtimes.length, 1, 'Returned single runtime')
  t.equal(plugins.runtimes.runtimes[0], name, 'Returned correct runtime name')
  t.equal(plugins.runtimes[name].name, name, 'Returned populated custom runtime object')
  t.deepEqual(plugins.runtimes[name], runtime, 'Returned populated custom runtime object')

  // Transpiled with default build dir via truthy build property
  runtime = { name, type, build: true, baseRuntime }
  plugin = () => runtime
  inventory = newInv([ plugin ])
  plugins = setRuntimesPlugins({ inventory, errors }, emptyProj)
  t.notOk(errors.length, 'Did not return errors')
  t.equal(plugins.build, 'build', 'Returned default build property')

  // Transpiled with default build dir via explicit build property
  runtime = { name, type, build, baseRuntime }
  plugin = () => runtime
  inventory = newInv([ plugin ])
  plugins = setRuntimesPlugins({ inventory, errors }, emptyProj)
  t.notOk(errors.length, 'Did not return errors')
  t.equal(plugins.build, build, 'Returned explicit build property')
})

test('Runtime setter validation (transpiled)', t => {
  t.plan(2)
  let inventory, plugin, runtime
  let type = 'transpiled'
  let errors = []

  // Invalid baseRuntime
  runtime = { name, type, baseRuntime: 'nodejs10.x' }
  plugin = () => runtime
  inventory = newInv([ plugin ])
  setRuntimesPlugins({ inventory, errors }, emptyProj)
  t.equal(errors.length, 1, 'Returned an error')
  t.match(errors[0], /must include a valid baseRuntime property/, 'Returned correct baseRuntime error')
})

test('Runtime setter validation', t => {
  t.plan(14)
  let errors, inventory, plugin, runtime
  let type = 'transpiled'
  let baseRuntime = 'nodejs14.x'

  // No name
  runtime = { type }
  plugin = () => runtime
  inventory = newInv([ plugin ])
  errors = []
  setRuntimesPlugins({ inventory, errors }, emptyProj)
  t.equal(errors.length, 1, 'Returned an error')
  t.match(errors[0], /Runtime plugin must provide a valid name/, 'Returned correct name error')

  // Invalid name
  runtime = { name: 'c++', type }
  plugin = () => runtime
  inventory = newInv([ plugin ])
  errors = []
  setRuntimesPlugins({ inventory, errors }, emptyProj)
  t.equal(errors.length, 1, 'Returned an error')
  t.match(errors[0], /Runtime plugin must provide a valid name/, 'Returned correct name error')

  // No type
  runtime = { name }
  plugin = () => runtime
  inventory = newInv([ plugin ])
  errors = []
  setRuntimesPlugins({ inventory, errors }, emptyProj)
  t.equal(errors.length, 1, 'Returned an error')
  t.match(errors[0], /Runtime plugin must provide a valid type/, 'Returned correct type error')

  // Invalid type
  runtime = { name, type: 'jit' }
  plugin = () => runtime
  inventory = newInv([ plugin ])
  errors = []
  setRuntimesPlugins({ inventory, errors }, emptyProj)
  t.equal(errors.length, 1, 'Returned an error')
  t.match(errors[0], /Runtime plugin must provide a valid type/, 'Returned correct type error')

  // Name cannot conflict with an existing runtime
  runtime = { name: 'nodejs14.x', type }
  plugin = () => runtime
  inventory = newInv([ plugin ])
  errors = []
  setRuntimesPlugins({ inventory, errors }, emptyProj)
  t.equal(errors.length, 1, 'Returned an error')
  t.match(errors[0], /Runtime name 'nodejs14\.x' is reserved/, 'Returned correct name error')

  // Name cannot conflict with an existing custom runtime
  runtime = { name, type, baseRuntime }
  plugin = () => [ runtime, runtime ]
  inventory = newInv([ plugin ])
  errors = []
  setRuntimesPlugins({ inventory, errors }, emptyProj)
  t.equal(errors.length, 1, 'Returned an error')
  t.match(errors[0], /Runtime name 'custom-runtime' already registered/, 'Returned correct name error')

  // Build dirs cannot conflict
  plugin = () => [ runtime, { name: 'idk', type, build: 'idk', baseRuntime } ]
  inventory = newInv([ plugin ])
  errors = []
  setRuntimesPlugins({ inventory, errors }, emptyProj)
  t.equal(errors.length, 1, 'Returned an error')
  t.match(errors[0], /cannot set a build directory, as it is already configured/, 'Returned correct build error')
})

test('Runtime setter errors', t => {
  t.plan(1)
  let errors, inventory, plugin
  plugin = () => { throw Error('uh oh') }
  inventory = newInv([ plugin ])
  errors = []
  t.throws(() => {
    setRuntimesPlugins({ inventory, errors }, emptyProj)
  }, /Runtime plugin exception/, 'Failing setter threw')
})
