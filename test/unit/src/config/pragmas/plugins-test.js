let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'plugins')
let populatePlugins = require(sut)
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let inventory = inventoryDefaults()
let cwd = inventory._project.src = process.cwd()
// fake method registering some list of plugin-created lambdas
inventory._project.plugins = { plugin: {
  pluginFunctions: () => []
} }
let mockRequire = require('mock-require')

test('Set up env', t => {
  t.plan(1)
  t.ok(populatePlugins, '@plugins module populator is present')
})

test('No @plugins returns null', t => {
  t.plan(1)
  t.equal(populatePlugins({ arc: {} }), null, 'Returned null')
})

test('missing @plugin throws', t => {
  t.plan(1)
  let arc = parse('@plugins\npoop')
  t.throws(() => populatePlugins({ arc, inventory }))
})

test('plugin-registered lambdas should contain all arc-required internal inventory signature properties ', t => {
  t.plan(3)
  let arc = parse('@plugins\nplugin')
  inventory._project.plugins = { plugin: {
    pluginFunctions: () => [
      { src: join(cwd, 'src', 'mahplugin', 'lambda1') },
      { src: join(cwd, 'src', 'mahplugin', 'lambda2') }
    ]
  } }
  let plugins = populatePlugins({ arc, inventory })
  t.equal(plugins.length, 2, 'Returned 1 object for each registered lambda')
  t.equal(plugins[0].name, 'mahplugin-lambda1', 'First lambda should have am AWS-compatible name')
  t.ok(plugins[1].config, 'should have a config property')
})
