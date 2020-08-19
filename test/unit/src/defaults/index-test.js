let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(sut)
let defaultFunctionConfig = require(join(sut, 'function-config'))

let str = s => JSON.stringify(s)

test('Set up env', t => {
  t.plan(1)
  t.ok(inventoryDefaults, 'Inventory defaults module is present')
})

let result = inventoryDefaults()

test('Inventory defaults returns correct default inventory object', t => {
  t.plan(17)
  t.equal(Object.keys(result).length, 16, 'Got correct number of params')
  t.ok(result.arc, 'Got arc')
  t.ok(result.project, 'Got project')
  t.equal(result.app, '', 'Got app')
  t.ok(result.aws, 'Got aws')
  t.equal(result.events, null, 'Got events')
  t.equal(result.http, null, 'Got http')
  t.equal(result.indexes, null, 'Got indexes')
  t.equal(result.macros, null, 'Got macros')
  t.equal(result.queues, null, 'Got queues')
  t.equal(result.scheduled, null, 'Got scheduled')
  t.equal(result.static, null, 'Got static')
  t.equal(result.streams, null, 'Got streams')
  t.equal(result.tables, null, 'Got tables')
  t.equal(result.ws, null, 'Got ws')
  t.equal(result.lambdaSrcDirs, null, 'Got lambdaSrcDirs')
  t.equal(result.localPaths, null, 'Got localPaths')
})

test('Architect project defaults are pre-populated', t => {
  t.plan(1)
  t.equal(result.aws.region, 'us-west-2', 'Region set by dfeault to us-west-2')
})

test('Inventory got default function config', t => {
  t.plan(2)
  let defaultConfig = defaultFunctionConfig()
  t.equal(str(result.arc.defaultFunctionConfig), str(defaultConfig), 'Arc got default function config')
  t.equal(str(result.project.defaultFunctionConfig), str(defaultConfig), 'Project got default function config')
})
