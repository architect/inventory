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

test('Set up env', t => {
  t.plan(1)
  t.ok(populatePlugins, '@plugins module populator is present')
})

test('No @plugins returns null', t => {
  t.plan(1)
  t.equal(populatePlugins({ arc: {} }), null, 'Returned null')
})

test('Missing @plugin errors', t => {
  t.plan(1)
  let inv = JSON.parse(JSON.stringify(inventory))
  let arc = parse('@plugins\npoop')
  let errors = []
  populatePlugins({ arc, inventory: inv, errors })
  t.ok(errors.length, 'Invalid plugin errored')
})

test('Plugin-registered Lambdas should contain all arc-required internal inventory signature properties (legacy pluginFunctions interface method)', t => {
  t.plan(3)
  let arc = parse('@plugins\nplugin')
  let inv = JSON.parse(JSON.stringify(inventory))
  inv._project.plugins = { plugin: {
    pluginFunctions: () => [
      { src: join(cwd, 'src', 'mahplugin', 'lambda1') },
      { src: join(cwd, 'src', 'mahplugin', 'lambda2') }
    ]
  } }
  let plugins = populatePlugins({ arc, inventory: inv })
  t.equal(plugins.length, 2, 'Returned 1 object for each registered Lambda')
  t.equal(plugins[0].name, 'mahplugin-lambda1', 'First Lambda should have am AWS-compatible name')
  t.ok(plugins[1].config, 'should have a config property')
})

test('Plugin-registered Lambdas should contain all arc-required internal inventory signature properties', t => {
  t.plan(3)
  let arc = parse('@plugins\nplugin')
  let inv = JSON.parse(JSON.stringify(inventory))
  inv._project.plugins = { plugin: {
    functions: () => [
      { src: join(cwd, 'src', 'mahplugin', 'lambda1') },
      { src: join(cwd, 'src', 'mahplugin', 'lambda2') }
    ]
  } }
  let plugins = populatePlugins({ arc, inventory: inv })
  t.equal(plugins.length, 2, 'Returned 1 object for each registered Lambda')
  t.equal(plugins[0].name, 'mahplugin-lambda1', 'First Lambda should have am AWS-compatible name')
  t.ok(plugins[1].config, 'should have a config property')
})

test('Plugin-registered Lambdas can specify name', t => {
  t.plan(7)
  let arc = parse('@plugins\nplugin')
  let inv = JSON.parse(JSON.stringify(inventory))
  inv._project.plugins = { plugin: {
    functions: () => [
      {
        name: 'lambda-1',
        src: join(cwd, 'src', 'mahplugin', 'lambda1')
      },
      {
        name: 'lambda-2',
        src: join(cwd, 'src', 'mahplugin', 'lambda2')
      }
    ]
  } }
  let plugins = populatePlugins({ arc, inventory: inv })
  t.equal(plugins.length, 2, 'Returned 1 object for each registered Lambda')
  t.equal(plugins[0].name, 'lambda-1', 'Lambda has a user-specified name')
  t.equal(plugins[0].src, join(cwd, 'src', 'mahplugin', 'lambda1'), 'Lambda src matches')
  t.ok(plugins[0].config, 'should have a config property')
  t.equal(plugins[1].name, 'lambda-2', 'Lambda has a user-specified name')
  t.equal(plugins[1].src, join(cwd, 'src', 'mahplugin', 'lambda2'), 'Lambda src matches')
  t.ok(plugins[1].config, 'should have a config property')
})

test('No registered plugin Lambdas returns empty array', t => {
  t.plan(1)
  let arc = parse('@plugins\nplugin')
  let inv = JSON.parse(JSON.stringify(inventory))
  inv._project.plugins = { plugin: {
    functions: () => []
  } }
  let plugins = populatePlugins({ arc, inventory: inv })
  t.notOk(plugins.length, 'Returned no registered Lambdas')
})


test('@plugins population: validation errors', t => {
  t.plan(6)

  let src = 'src-dir'
  let errors = []
  function run (arr) {
    let arc = parse(`@plugins\nplugin`)
    let inv = JSON.parse(JSON.stringify(inventory))
    inv._project.plugins = { plugin: {
      functions: () => arr
    } }
    populatePlugins({ arc, inventory: inv, errors })
    // t.notOk(plugins.length, 'Returned no registered Lambdas')
    // populateHTTP({ arc, inventory, errors })
  }
  function check (str = 'Invalid path errored', qty = 1) {
    t.equal(errors.length, qty, str)
    console.log(errors.join('\n'))
    // Run a bunch of control tests at the top by resetting errors after asserting
    errors = []
  }

  // Controls
  run([
    { src },
    { name: 'hi-there', src },
    { name: 'hi.there', src },
    { name: 'hi_there', src },
    { name: 'hiThere', src },
  ])
  t.equal(errors.length, 0, `Valid routes did not error`)


  run([
    { name: 'hi', src },
    { name: 'hi', src },
  ])
  check(`Duplicate functions errored`)

  run([ { name: 'hi there', src } ])
  check()

  run([ { name: 'hi-there!', src } ])
  check()

  run([ { name: 'hi-there' } ])
  check()

  run([ { src: 'hi-there!' } ])
  check('Inferred name from invalid src')
})
