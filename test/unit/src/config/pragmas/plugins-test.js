let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'plugins')
let populatePlugins = require(sut)
let mockFs = require('mock-fs')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let inventory = inventoryDefaults()
let cwd = inventory._project.src = process.cwd()
let mockRequire = require('mock-require')

test('Set up env', t => {
  t.plan(1)
  t.ok(populatePlugins, '@plugins module populator is present')
})

test('No @plugins returns empty object', t => {
  t.plan(1)
  t.equal(Object.keys(populatePlugins({ arc: {} })).length, 0, 'Returned empty object')
})

test('@plugin via src/plugins/plugin.js', t => {
  t.plan(1)
  let arc = parse('@plugins\nplugin')
  mockFs({ 'src/plugins': {
    'plugin.js': 'module.exports = {}'
  } })
  mockRequire(join(cwd, 'src', 'plugins', 'plugin.js'), {})
  let plugins = populatePlugins({ arc, inventory })
  mockFs.restore()
  t.equal(typeof plugins['plugin'], 'object', 'Returned object for plugin by name in plugin map')
  mockRequire.stopAll()
})

test('@plugin via src/plugins/plugin/index.js', t => {
  t.plan(1)
  let arc = parse('@plugins\nplugin')
  mockFs({ 'src/plugins/plugin': {
    'index.js': 'module.exports = {}'
  } })
  mockRequire(join(cwd, 'src', 'plugins', 'plugin'), {})
  let plugins = populatePlugins({ arc, inventory })
  mockFs.restore()
  t.equal(typeof plugins['plugin'], 'object', 'Returned object for plugin by name in plugin map')
  mockRequire.stopAll()
})

test('@plugin via node_modules/plugin/index.js', t => {
  t.plan(1)
  let arc = parse('@plugins\nplugin')
  mockFs({ 'node_modules/plugin': {
    'index.js': 'module.exports = {}'
  } })
  mockRequire(join(cwd, 'node_modules', 'plugin'), {})
  let plugins = populatePlugins({ arc, inventory })
  mockFs.restore()
  t.equal(typeof plugins['plugin'], 'object', 'Returned object for plugin by name in plugin map')
  mockRequire.stopAll()
})

test('@plugin via node_modules/@plugin/index.js', t => {
  t.plan(1)
  let arc = parse('@plugins\nplugin')
  mockFs({ 'node_modules/@plugin': {
    'index.js': 'module.exports = {}'
  } })
  mockRequire(join(cwd, 'node_modules', '@plugin'), {})
  let plugins = populatePlugins({ arc, inventory })
  mockFs.restore()
  t.equal(typeof plugins['plugin'], 'object', 'Returned object for plugin by name in plugin map')
  mockRequire.stopAll()
})

test('missing @plugin warns you', t => {
  t.plan(1)
  let arc = parse('@plugins\nplugin')
  let origWarn = console.warn
  let warning = ''
  console.warn = (msg) => { warning = msg }
  populatePlugins({ arc, inventory })
  t.match(warning, /cannot find plugin plugin/i, 'Missing plugin raised a warning')
  console.warn = origWarn
})
