let { join, sep  } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let mockFs = require('mock-fs')
let mockRequire = require('mock-require')
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
  mockFs.restore()
}

test('Set up env', t => {
  t.plan(1)
  t.ok(populatePlugins, '@plugins module populator is present')
})

test('No @plugins or @macros returns null', t => {
  t.plan(1)
  t.equal(populatePlugins({ arc: {} }), null, 'Returned null')
})

test('Missing @plugin errors', t => {
  t.plan(4)
  setup()
  let err = /Cannot find plugin/
  let arc = parse('@plugins\nidk')
  let errors = []
  populatePlugins({ arc, inventory, errors })
  t.equal(errors.length, 1, 'Invalid plugin errored')
  t.match(errors[0], err, `Got correct error: ${errors[0]}`)

  arc = parse('@plugins\nhi there')
  errors = []
  populatePlugins({ arc, inventory, errors })
  t.equal(errors.length, 1, 'Invalid plugin errored')
  t.match(errors[0], err, `Got correct error: ${errors[0]}`)
})

test('Missing @macro errors', t => {
  t.plan(2)
  setup()
  let err = /Cannot find plugin/
  let arc = parse('@macros\nidk')
  let errors = []
  populatePlugins({ arc, inventory, errors })
  t.equal(errors.length, 1, 'Invalid plugin errored')
  t.match(errors[0], err, `Got correct error: ${errors[0]}`)
})

test('Check plugin file paths', t => {
  t.plan(40)
  let path = join(sep, 'foo')
  let name1 = 'proj1'
  let name2 = 'proj2'
  let pluginPaths = [
    // Plugins: simple
    join(path, 'src', 'plugins', `${name1}.js`),
    join(path, 'src', 'plugins', name1),
    join(path, 'node_modules', name1),
    join(path, 'node_modules', `@${name1}`),
    // Plugins: verbose
    join(path, 'custom-path', name1),
    // Macros: simple
    join(path, 'src', 'macros', `${name2}.js`),
    join(path, 'src', 'macros', name2),
    join(path, 'node_modules', name2),
    join(path, 'node_modules', `@${name2}`),
  ]
  let enplugin = fn => ({ sandbox: { start: fn } })
  // Plugins
  mockRequire(pluginPaths[0], enplugin(function pluginPath0 () {}))
  mockRequire(pluginPaths[1], enplugin(function pluginPath1 () {}))
  mockRequire(pluginPaths[2], enplugin(function pluginPath2 () {}))
  mockRequire(pluginPaths[3], enplugin(function pluginPath3 () {}))
  mockRequire(pluginPaths[4], enplugin(function pluginPath4 () {}))
  // Macros
  mockRequire(pluginPaths[5], function pluginPath5 () {})
  mockRequire(pluginPaths[6], function pluginPath6 () {})
  mockRequire(pluginPaths[7], function pluginPath7 () {})
  mockRequire(pluginPaths[8], function pluginPath8 () {})

  let errors
  let result
  let arc = { plugins: [ name1 ] }

  // Simple
  setup(path)
  mockFs({ [pluginPaths[0]]: null })
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  t.ok(result[name1], 'Got back a valid plugin')
  t.notOk(errors.length, 'No errors reported')
  t.equal(result[name1].sandbox.start.name, 'pluginPath0', 'Got back correct plugin: pluginPath0')
  t.equal(result._methods.sandbox.start[0].name, 'pluginPath0', 'Got back correct plugin _method: pluginPath0')

  setup(path)
  mockFs({ [pluginPaths[1]]: null })
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  t.ok(result[name1], 'Got back a valid plugin')
  t.notOk(errors.length, 'No errors reported')
  t.equal(result[name1].sandbox.start.name, 'pluginPath1', 'Got back correct plugin: pluginPath1')
  t.equal(result._methods.sandbox.start[0].name, 'pluginPath1', 'Got back correct plugin _method: pluginPath1')

  setup(path)
  mockFs({ [pluginPaths[2]]: null })
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  t.ok(result[name1], 'Got back a valid plugin')
  t.notOk(errors.length, 'No errors reported')
  t.equal(result[name1].sandbox.start.name, 'pluginPath2', 'Got back correct plugin: pluginPath2')
  t.equal(result._methods.sandbox.start[0].name, 'pluginPath2', 'Got back correct plugin _method: pluginPath2')

  setup(path)
  mockFs({ [pluginPaths[3]]: null })
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  t.ok(result[name1], 'Got back a valid plugin')
  t.notOk(errors.length, 'No errors reported')
  t.equal(result[name1].sandbox.start.name, 'pluginPath3', 'Got back correct plugin: pluginPath3')
  t.equal(result._methods.sandbox.start[0].name, 'pluginPath3', 'Got back correct plugin _method: pluginPath3')

  // Verbose
  arc = parse(`@plugins
proj1
  src '${pluginPaths[4]}'`)
  setup(path)
  mockFs({ [pluginPaths[4]]: null })
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  t.ok(result[name1], 'Got back a valid plugin')
  t.notOk(errors.length, 'No errors reported')
  t.equal(result[name1].sandbox.start.name, 'pluginPath4', 'Got back correct plugin: pluginPath4')
  t.equal(result._methods.sandbox.start[0].name, 'pluginPath4', 'Got back correct plugin _method: pluginPath4')

  // Verbose that does not include src property
  arc = parse(`@plugins
proj1
  idk whatever`)
  setup(path)
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  t.ok(result[name1], 'Got back a valid plugin')
  t.notOk(errors.length, 'No errors reported')
  t.equal(result[name1].sandbox.start.name, 'pluginPath1', 'Got back correct plugin: pluginPath1')
  t.equal(result._methods.sandbox.start[0].name, 'pluginPath1', 'Got back correct plugin _method: pluginPath1')

  // Macros
  arc = { macros: [ name2 ] }

  setup(path)
  mockFs({ [pluginPaths[5]]: null })
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  t.ok(result[name2], 'Got back a valid macro (plugin compat)')
  t.notOk(errors.length, 'No errors reported')
  t.equal(result[name2].deploy.start.name, 'pluginPath5', 'Got back correct macro (mapped to deploy.start): pluginPath5')
  t.equal(result._methods.deploy.start[0].name, 'pluginPath5', 'Got back correct macro (mapped to deploy.start): pluginPath5')

  setup(path)
  mockFs({ [pluginPaths[6]]: null })
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  t.ok(result[name2], 'Got back a valid macro (plugin compat)')
  t.notOk(errors.length, 'No errors reported')
  t.equal(result[name2].deploy.start.name, 'pluginPath6', 'Got back correct macro (mapped to deploy.start): pluginPath6')
  t.equal(result._methods.deploy.start[0].name, 'pluginPath6', 'Got back correct macro (mapped to deploy.start): pluginPath6')

  setup(path)
  mockFs({ [pluginPaths[7]]: null })
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  t.ok(result[name2], 'Got back a valid macro (plugin compat)')
  t.notOk(errors.length, 'No errors reported')
  t.equal(result[name2].deploy.start.name, 'pluginPath7', 'Got back correct macro (mapped to deploy.start): pluginPath7')
  t.equal(result._methods.deploy.start[0].name, 'pluginPath7', 'Got back correct macro (mapped to deploy.start): pluginPath7')

  setup(path)
  mockFs({ [pluginPaths[8]]: null })
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  t.ok(result[name2], 'Got back a valid macro (plugin compat)')
  t.notOk(errors.length, 'No errors reported')
  t.equal(result[name2].deploy.start.name, 'pluginPath8', 'Got back correct macro (mapped to deploy.start): pluginPath8')
  t.equal(result._methods.deploy.start[0].name, 'pluginPath8', 'Got back correct macro (mapped to deploy.start): pluginPath8')

  mockFs.restore()
  mockRequire.stopAll()
})

test('@plugins validation', t => {
  t.plan(40)
  let path = join(sep, 'foo')
  let arc, err, errors, result
  let name1 = 'proj1'
  let name2 = 'proj2'
  let pluginPath1 = join(path, 'src', 'plugins', name1)
  let pluginPath2 = join(path, 'src', 'plugins', name2)

  arc = { plugins: [ name1 ] }
  setup(path)
  mockFs({
    [pluginPath1]: null,
    [pluginPath2]: null,
  })

  // Unknown methods are ignored by method tree
  mockRequire(pluginPath1, { idk: { start: () => {} } })
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  t.ok(result[name1], 'Got back a valid plugin')
  t.notOk(errors.length, 'No errors reported')
  t.ok(is.fn(result[name1].idk.start), 'Found unknown method in plugin')
  t.notOk(result._methods.idk, 'Did not find unknown function in _methods')

  // Workflow is a sync function
  mockRequire(pluginPath1, { sandbox: { start: () => {} } })
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  t.ok(result[name1], 'Got back a valid plugin')
  t.notOk(errors.length, 'No errors reported')
  t.ok(is.fn(result[name1].sandbox.start), 'Found Sandbox lifecycle function in plugin')
  t.ok(is.fn(result._methods.sandbox.start[0]), 'Found Sandbox lifecycle function in _methods')

  // Workflow is an async function
  mockRequire(pluginPath1, { sandbox: { start: async () => {} } })
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  t.ok(result[name1], 'Got back a valid plugin')
  t.notOk(errors.length, 'No errors reported')
  t.ok(is.fn(result[name1].sandbox.start), 'Found Sandbox lifecycle function in plugin')
  t.ok(is.fn(result._methods.sandbox.start[0]), 'Found Sandbox lifecycle function in _methods')

  // Workflow is !function
  mockRequire(pluginPath1, { sandbox: { start: 'hello' } })
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  err = /Invalid plugin, must be a function/
  t.equal(errors.length, 1, 'Invalid plugin errored')
  t.match(errors[0], err, `Got correct error: ${errors[0]}`)

  // Multiple workflows aggregate in plugin arrays
  arc = { plugins: [ name1, name2 ] }
  mockRequire(pluginPath1, { sandbox: { start: async () => {} } })
  mockRequire(pluginPath2, { sandbox: { start: async () => {} } })
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  t.ok(result[name1], 'Got back a valid plugin')
  t.ok(result[name2], 'Got back a valid plugin')
  t.notOk(errors.length, 'No errors reported')
  t.ok(is.fn(result[name1].sandbox.start), 'Found Sandbox lifecycle function in plugin')
  t.ok(is.fn(result[name2].sandbox.start), 'Found Sandbox lifecycle function in plugin')
  t.equal(result._methods.sandbox.start.length, 2, 'Got two Sandbox lifecycle functions in _methods')
  t.ok(is.fn(result._methods.sandbox.start[0]), 'Found Sandbox lifecycle function in _methods')
  t.ok(is.fn(result._methods.sandbox.start[1]), 'Found Sandbox lifecycle function in _methods')

  // Setter is a sync function
  arc = { plugins: [ name1 ] }
  mockRequire(pluginPath1, { set: { http: () => {} } })
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  t.ok(result[name1], 'Got back a valid plugin')
  t.notOk(errors.length, 'No errors reported')
  t.ok(is.fn(result[name1].set.http), 'Found HTTP setter function in plugin')
  t.ok(is.fn(result._methods.set.http[0]), 'Found HTTP setter function in _methods')

  // Setter is !function
  mockRequire(pluginPath1, { set: { http: 'hello' } })
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  err = /setters must be synchronous functions/
  t.equal(errors.length, 1, 'Invalid plugin errored')
  t.match(errors[0], err, `Got correct error: ${errors[0]}`)

  // Setter is an async function
  mockRequire(pluginPath1, { set: { http: async () => {} } })
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  err = /setters must be synchronous functions/
  t.equal(errors.length, 1, 'Invalid plugin errored')
  t.match(errors[0], err, `Got correct error: ${errors[0]}`)

  // Multiple setters aggregate in plugin arrays
  arc = { plugins: [ name1, name2 ] }
  mockRequire(pluginPath1, { set: { http: () => {} } })
  mockRequire(pluginPath2, { set: { http: () => {} } })
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  t.ok(result[name1], 'Got back a valid plugin')
  t.ok(result[name2], 'Got back a valid plugin')
  t.notOk(errors.length, 'No errors reported')
  t.ok(is.fn(result[name1].set.http), 'Found HTTP setter function in plugin')
  t.ok(is.fn(result[name2].set.http), 'Found HTTP setter function in plugin')
  t.equal(result._methods.set.http.length, 2, 'Got two Sandbox lifecycle functions in _methods')
  t.ok(is.fn(result._methods.set.http[0]), 'Found Sandbox lifecycle function in _methods')
  t.ok(is.fn(result._methods.set.http[1]), 'Found Sandbox lifecycle function in _methods')

  // Plugin uses a reserved name
  name1 = '_methods'
  pluginPath1 = join(path, 'src', 'plugins', name1)
  arc = { plugins: [ name1 ] }
  setup(path)
  mockFs({ [pluginPath1]: null })
  mockRequire(pluginPath1, {})
  errors = []
  result = populatePlugins({ arc, inventory, errors })
  err = /Plugin name _methods is reserved/
  t.equal(errors.length, 1, 'Invalid plugin errored')
  t.match(errors[0], err, `Got correct error: ${errors[0]}`)

  mockFs.restore()
  mockRequire.stopAll()
})

test('@plugins fail to load', t => {
  t.plan(2)
  let path = join(sep, 'foo')
  let name1 = 'proj1'
  let pluginPath1 = join(path, 'src', 'plugins', name1)
  let arc = { plugins: [ name1 ] }
  setup(path)
  mockFs({ [pluginPath1]: null })

  mockRequire(pluginPath1, null)
  let errors = []
  populatePlugins({ arc, inventory, errors })
  let err = /Unable to load plugin 'proj1'/
  t.equal(errors.length, 1, 'Invalid plugin errored')
  t.match(errors[0], err, `Got correct error: ${errors[0]}`)

  mockFs.restore()
  mockRequire.stopAll()
})
