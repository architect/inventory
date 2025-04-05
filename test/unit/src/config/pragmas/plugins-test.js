let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let cwd = process.cwd()
let libPath = join(cwd, 'src', 'lib')
let { is } = require(libPath)
let sut = join(cwd, 'src', 'config', 'pragmas', 'plugins')
let populatePlugins = require(sut)
let inventoryDefaultsPath = join(cwd, 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)

let inventory
function setup (path) {
  inventory = inventoryDefaults()
  inventory._project.cwd = path || cwd
  process.chdir(path || cwd)
}

test('Set up env', t => {
  t.plan(1)
  t.ok(populatePlugins, '@plugins module populator is present')
})

test('No @plugins or @macros returns null', async t => {
  t.plan(1)
  t.equal(await populatePlugins({ arc: {} }), null, 'Returned null')
})

test('Missing @plugin errors', async t => {
  t.plan(4)
  setup()
  let err = /Cannot find plugin/
  let arc = parse('@plugins\nidk')
  let errors = []
  await populatePlugins({ arc, inventory, errors })
  t.equal(errors.length, 1, 'Invalid plugin errored')
  t.match(errors[0], err, `Got correct error: ${errors[0]}`)

  arc = parse('@plugins\nhi there')
  errors = []
  await populatePlugins({ arc, inventory, errors })
  t.equal(errors.length, 1, 'Invalid plugin errored')
  t.match(errors[0], err, `Got correct error: ${errors[0]}`)
})

test('Missing @macro errors', async t => {
  t.plan(2)
  setup()
  let err = /Cannot find plugin/
  let arc = parse('@macros\nidk')
  let errors = []
  await populatePlugins({ arc, inventory, errors })
  t.equal(errors.length, 1, 'Invalid plugin errored')
  t.match(errors[0], err, `Got correct error: ${errors[0]}`)
})

test('Check plugin file paths', async t => {
  t.plan(96)
  let mockRoot = join(cwd, 'test', 'mock', 'plugin-paths')
  let arc, result
  let plugin = 'a-plugin'
  let pluginFnName = 'aPlugin'
  let macro = 'a-macro'
  let macroFnName = 'aMacro'
  let errors = []

  function check (pluginName, fnName, _type, hook) {
    t.ok(result[pluginName], 'Got back a valid plugin')
    t.notOk(errors.length, 'No errors reported')
    if (errors.length) console.log('Errors:', errors)
    t.equal(result[pluginName][hook].start.name, fnName, `Got back correct plugin: ${fnName}`)
    t.equal(result[pluginName][hook].start._plugin, pluginName, `Got back correct plugin name: ${pluginName}`)
    t.equal(result[pluginName][hook].start._type, _type, 'Got back correct plugin type: plugin')
    t.equal(result._methods[hook].start[0].name, fnName, `Got back correct plugin _method: ${fnName}`)
    t.equal(result._methods[hook].start[0]._plugin, pluginName, `Got back correct plugin name: ${pluginName}`)
    t.equal(result._methods[hook].start[0]._type, _type, 'Got back correct plugin type: plugin')
  }

  setup(join(mockRoot, 'plugin-js'))
  arc = { plugins: [ plugin ] }
  result = await populatePlugins({ arc, inventory, errors })
  check(plugin, pluginFnName, 'plugin', 'sandbox')

  setup(join(mockRoot, 'plugin-mjs'))
  arc = { plugins: [ plugin ] }
  result = await populatePlugins({ arc, inventory, errors })
  check(plugin, pluginFnName, 'plugin', 'sandbox')

  setup(join(mockRoot, 'plugin-folder-js'))
  arc = { plugins: [ plugin ] }
  result = await populatePlugins({ arc, inventory, errors })
  check(plugin, pluginFnName, 'plugin', 'sandbox')

  setup(join(mockRoot, 'plugin-folder-mjs'))
  arc = { plugins: [ plugin ] }
  result = await populatePlugins({ arc, inventory, errors })
  check(plugin, pluginFnName, 'plugin', 'sandbox')

  setup(join(mockRoot, 'plugin-custom-path'))
  arc = { plugins: [
    { 'a-plugin': { src: join('src', 'a-plugin') } },
    // Tests default paths in plugins structured as objects without src
    { 'another-plugin': { 'some-setting': 'whatev' } },
  ] }
  result = await populatePlugins({ arc, inventory, errors })
  check(plugin, pluginFnName, 'plugin', 'sandbox')

  setup(join(mockRoot, 'nm-plugin'))
  arc = { plugins: [ plugin ] }
  result = await populatePlugins({ arc, inventory, errors })
  check(plugin, pluginFnName, 'plugin', 'sandbox')

  setup(join(mockRoot, 'nm-atplugin'))
  arc = { plugins: [ plugin ] }
  result = await populatePlugins({ arc, inventory, errors })
  check(plugin, pluginFnName, 'plugin', 'sandbox')

  setup(join(mockRoot, 'macro-js'))
  arc = { macros: [ macro ] }
  result = await populatePlugins({ arc, inventory, errors })
  check(macro, macroFnName, 'macro', 'deploy')

  setup(join(mockRoot, 'macro-folder'))
  arc = { macros: [ macro ] }
  result = await populatePlugins({ arc, inventory, errors })
  check(macro, macroFnName, 'macro', 'deploy')

  setup(join(mockRoot, 'macro-custom-path'))
  arc = { macros: [ { 'a-macro': { src: join('src', 'a-macro') } } ] }
  result = await populatePlugins({ arc, inventory, errors })
  check(macro, macroFnName, 'macro', 'deploy')

  setup(join(mockRoot, 'nm-macro'))
  arc = { macros: [ macro ] }
  result = await populatePlugins({ arc, inventory, errors })
  check(macro, macroFnName, 'macro', 'deploy')

  setup(join(mockRoot, 'nm-atmacro'))
  arc = { macros: [ macro ] }
  result = await populatePlugins({ arc, inventory, errors })
  check(macro, macroFnName, 'macro', 'deploy')
})

test('@plugins validation', async t => {
  t.plan(45)
  let mockRoot = join(cwd, 'test', 'mock', 'plugin-validation')
  let arc, err, errors, result
  let plugin1 = 'a-plugin-1'
  let plugin2 = 'a-plugin-2'
  arc = { plugins: [ plugin1, plugin2 ] }

  // Multiple plugins aggregate into plugin arrays
  setup(join(mockRoot, 'valid'))
  errors = []
  result = await populatePlugins({ arc, inventory, errors })
  t.ok(result[plugin1], 'Got back valid plugin 1')
  t.ok(result[plugin2], 'Got back valid plugin 2')
  t.notOk(errors.length, 'No errors reported')

  // Unknown methods are ignored by method tree
  t.ok(is.fn(result[plugin1].idk.start), 'Found unknown method in plugin')
  t.notOk(result._methods.idk, 'Did not find unknown function in _methods')

  // Workflow functions are sync
  t.ok(is.fn(result[plugin1].sandbox.start), 'Found sandbox.start function in plugin 1')
  t.ok(is.fn(result[plugin2].sandbox.start), 'Found sandbox.start function in plugin 2')
  t.equal(result._methods.sandbox.start.length, 2, 'Got two sandbox.start lifecycle functions in _methods')
  t.ok(is.fn(result._methods.sandbox.start[0]), 'Found plugin 1 sandbox.start function in _methods')
  t.ok(is.fn(result._methods.sandbox.start[1]), 'Found plugin 2 sandbox.start function in _methods')
  t.equal(result[plugin1].sandbox.start.constructor.name, 'Function', 'sandbox.start function is synchronous in plugin 1')
  t.equal(result[plugin2].sandbox.start.constructor.name, 'Function', 'sandbox.start function is synchronous in plugin 2')

  // Workflow functions are async
  t.ok(is.fn(result[plugin1].sandbox.end), 'Found sandbox.end function in plugin 1')
  t.ok(is.fn(result[plugin2].sandbox.end), 'Found sandbox.end function in plugin 2')
  t.equal(result._methods.sandbox.end.length, 2, 'Got two sandbox.end lifecycle functions in _methods')
  t.ok(is.fn(result._methods.sandbox.end[0]), 'Found plugin 1 sandbox.end function in _methods')
  t.ok(is.fn(result._methods.sandbox.end[1]), 'Found plugin 2 sandbox.end function in _methods')
  t.equal(result[plugin1].sandbox.end.constructor.name, 'AsyncFunction', 'sandbox.end function is async in plugin 1')
  t.equal(result[plugin2].sandbox.end.constructor.name, 'AsyncFunction', 'sandbox.end function is async in plugin 2')

  // Setter functions are sync
  t.ok(is.fn(result[plugin1].set.http), 'Found set.http function in plugin 1')
  t.ok(is.fn(result[plugin2].set.events), 'Found set.events function in plugin 2')
  t.ok(is.fn(result._methods.set.http[0]), 'Found set.http function in _methods')
  t.ok(is.fn(result._methods.set.http[1]), 'Found set.http function in _methods')
  t.ok(is.fn(result._methods.set.events[0]), 'Found set.events function in _methods')
  t.equal(result[plugin1].set.http.constructor.name, 'Function', 'set.http function is synchronous in plugin 1')
  t.equal(result[plugin2].set.http.constructor.name, 'Function', 'set.http function is synchronous in plugin 2')
  t.equal(result[plugin2].set.events.constructor.name, 'Function', 'set.events function is synchronous in plugin 2')

  // Special non-function properties are recognized
  t.ok(is.array(result[plugin1].create.register), 'Found create.register array in plugin 1')
  t.ok(is.array(result[plugin2].create.register), 'Found create.register array in plugin 2')
  t.ok(is.array(result._methods.create.register), 'Found create.register array in _methods')
  t.equal(result[plugin1].create.register._plugin, 'a-plugin-1', 'create.register array is tagged to plugin 1')
  t.equal(result[plugin2].create.register._plugin, 'a-plugin-2', 'create.register array is tagged to plugin 2')
  t.equal(result._methods.create.register[0]._plugin, 'a-plugin-1', 'create.register array in _methods is tagged to plugin 1')
  t.equal(result._methods.create.register[1]._plugin, 'a-plugin-2', 'create.register array in _methods is tagged to plugin 2')

  // Errors!
  arc = { plugins: [ plugin1 ] }
  setup(join(mockRoot, 'invalid'))

  errors = []
  result = await populatePlugins({ arc, inventory, errors })
  t.ok(result[plugin1], 'Got back a valid plugin')
  t.equal(errors.length, 3, 'Invalid plugin errored')

  // Workflow is !function
  err = /Invalid plugin, method must be a function/
  t.match(errors[0], err, `Got correct error: ${errors[0]}`)

  // Special array/string plugin property is not
  err = /property must be a string or array/
  t.match(errors[1], err, `Got correct error: ${errors[1]}`)

  // Setter is !function
  err = /setters must be synchronous functions/
  t.match(errors[2], err, `Got correct error: ${errors[2]}`)

  // Plugin uses a reserved name (internal to plugins)
  arc = { plugins: [ '_methods' ] }
  errors = []
  result = await populatePlugins({ arc, inventory, errors })
  err = /Plugin name _methods is reserved/
  t.equal(errors.length, 1, 'Invalid plugin errored')
  t.match(errors[0], err, `Got correct error: ${errors[0]}`)

  // TODO: Plugin uses a reserved name (pragma conflict)

  // Plugin uses an invalid name
  arc = { plugins: [ '@wesome-plugin!' ] }
  errors = []
  result = await populatePlugins({ arc, inventory, errors })
  err = /Plugin names can only contain/
  t.equal(errors.length, 1, 'Invalid plugin errored')
  t.match(errors[0], err, `Got correct error: ${errors[0]}`)

  // Plugin fails to load
  arc = { plugins: [ 'no-load' ] }
  errors = []
  result = await populatePlugins({ arc, inventory, errors })
  err = /Unable to load plugin 'no-load'/
  t.equal(errors.length, 1, 'Invalid plugin errored')
  t.match(errors[0], err, `Got correct error: ${errors[0]}`)
})

test('Teardown', t => {
  t.plan(1)
  process.chdir(cwd)
  t.pass('Tore down env')
})
