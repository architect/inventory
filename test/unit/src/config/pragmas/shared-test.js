let { join } = require('path')
let mockFs = require('mock-fs')
let parse = require('@architect/parser')
let test = require('tape')
let cwd = process.cwd()
let populateHTTPPath = join(cwd, 'src', 'config', 'pragmas', 'http')
let populateHTTP = require(populateHTTPPath)
let populateEventsPath = join(cwd, 'src', 'config', 'pragmas', 'events')
let populateEvents = require(populateEventsPath)
let populateQueuesPath = join(cwd, 'src', 'config', 'pragmas', 'queues')
let populateQueues = require(populateQueuesPath)
let inventoryDefaultsPath = join(cwd, 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let testLibPath = join(cwd, 'test', 'lib')
let testLib = require(testLibPath)
let sut = join(cwd, 'src', 'config', 'pragmas', 'shared')
let populateShared = require(sut)

let lambdaSrcDirs = [] // Only needs to be truthy to test code path
let setterPluginSetup = testLib.setterPluginSetup.bind({}, 'shared')

test('Set up env', t => {
  t.plan(1)
  t.ok(populateShared, '@shared populator is present')
})

test('No lambdae anywhere returns null @shared', t => {
  t.plan(1)
  let inventory = inventoryDefaults()
  t.deepEqual(populateShared({ arc: {}, pragmas: {}, inventory }), null, 'Returned null')
})

test('Project with any lambdae get a default @shared object', t => {
  t.plan(1)
  let inventory = inventoryDefaults()
  let shared = populateShared({ arc: {}, pragmas: { lambdaSrcDirs }, inventory })
  t.equal(shared, null, 'Returned null')
})

test('Default dir is: src/shared (if present)', t => {
  t.plan(2)
  let inventory = inventoryDefaults()
  let arc
  let pragmas
  arc = parse(`@http`)
  pragmas = { http: populateHTTP({ arc, inventory }), lambdaSrcDirs }
  mockFs({ 'src/shared': {} })
  let shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared.src, join(cwd, 'src', 'shared'), 'Returned correct default dir')
  t.deepEqual(shared.shared, [], 'Returned empty shared array')
  mockFs.restore()
})

test('Arc Static Asset Proxy is not included in @shared', t => {
  t.plan(4)
  let inventory = inventoryDefaults()
  let arc
  let pragmas
  arc = parse(`@http
get /foo
@shared
http
  get /*`)
  pragmas = { http: populateHTTP({ arc, inventory }), lambdaSrcDirs }
  mockFs({ 'src/shared': {} })
  let shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared.src, join(cwd, 'src', 'shared'), 'Returned correct default dir')
  t.deepEqual(shared.shared, [], 'Returned empty shared array')
  let asap = pragmas.http.find(r => r.name === 'get /*')
  t.ok(asap.arcStaticAssetProxy, 'Got back ASAP')
  t.notOk(asap.config.shared, `Shared setting not enabled in ASAP`)
  mockFs.restore()
})

test(`@shared population: defaults to enabled (without @shared)`, t => {
  t.plan(6)
  let inventory = inventoryDefaults()
  let arc
  let pragmas
  let httpLambda = 'get /'
  let eventLambda = 'an-event'
  arc = parse(`@http\n${httpLambda}\n@events\n${eventLambda}`)
  pragmas = {
    http: populateHTTP({ arc, inventory }),
    events: populateEvents({ arc, inventory }),
    lambdaSrcDirs
  }

  mockFs({ 'src/shared': {} })
  let shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared.src, join(cwd, 'src', 'shared'), 'Returned correct default dir')
  t.equal(shared.shared.length, 2, 'Got correct number of lambdae with shared back')
  let fn1 = pragmas.http.find(r => r.name === httpLambda)
  let fn2 = pragmas.events.find(r => r.name === eventLambda)
  t.ok(shared.shared.includes(fn1.src), `Got shared lambda: ${httpLambda}`)
  t.ok(shared.shared.includes(fn2.src), `Got shared lambda: ${eventLambda}`)
  t.ok(fn1.config.shared, `Shared setting enabled in lambda: ${httpLambda}`)
  t.ok(fn2.config.shared, `Shared setting enabled in lambda: ${eventLambda}`)
  mockFs.restore()
})

test(`@shared population: defaults to enabled (with empty @shared)`, t => {
  t.plan(6)
  let inventory = inventoryDefaults()
  let arc
  let pragmas
  let httpLambda = 'get /'
  let eventLambda = 'an-event'
  arc = parse(`@http\n${httpLambda}\n@events\n${eventLambda}\n@shared`)
  pragmas = {
    http: populateHTTP({ arc, inventory }),
    events: populateEvents({ arc, inventory }),
    lambdaSrcDirs
  }

  mockFs({ 'src/shared': {} })
  let shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared.src, join(cwd, 'src', 'shared'), 'Returned correct default dir')
  t.equal(shared.shared.length, 2, 'Got correct number of lambdae with shared back')
  let fn1 = pragmas.http.find(r => r.name === httpLambda)
  let fn2 = pragmas.events.find(r => r.name === eventLambda)
  t.ok(shared.shared.includes(fn1.src), `Got shared lambda: ${httpLambda}`)
  t.ok(shared.shared.includes(fn2.src), `Got shared lambda: ${eventLambda}`)
  t.ok(fn1.config.shared, `Shared setting enabled in lambda: ${httpLambda}`)
  t.ok(fn2.config.shared, `Shared setting enabled in lambda: ${eventLambda}`)
  mockFs.restore()
})

test(`@shared population: defaults to enabled (with src setting)`, t => {
  t.plan(6)
  let inventory = inventoryDefaults()
  let arc
  let pragmas
  let httpLambda = 'get /'
  let eventLambda = 'an-event'
  arc = parse(`@http\n${httpLambda}\n@events\n${eventLambda}
@shared
src foo/bar`)
  pragmas = {
    http: populateHTTP({ arc, inventory }),
    events: populateEvents({ arc, inventory }),
    lambdaSrcDirs
  }

  mockFs({ 'foo/bar': {} })
  let shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared.src, 'foo/bar', 'Got correct src dir back')
  t.equal(shared.shared.length, 2, 'Got correct number of lambdae with shared back')
  let fn1 = pragmas.http.find(r => r.name === httpLambda)
  let fn2 = pragmas.events.find(r => r.name === eventLambda)
  t.ok(shared.shared.includes(fn1.src), `Got shared lambda: ${httpLambda}`)
  t.ok(shared.shared.includes(fn2.src), `Got shared lambda: ${eventLambda}`)
  t.ok(fn1.config.shared, `Shared setting enabled in lambda: ${httpLambda}`)
  t.ok(fn2.config.shared, `Shared setting enabled in lambda: ${eventLambda}`)
  mockFs.restore()
})

test(`@shared population: plugin setter`, t => {
  t.plan(16)
  let inventory = inventoryDefaults()
  let setter = () => ({ src: 'foo/bar' })
  inventory.plugins = setterPluginSetup(setter)

  let arc
  let pragmas
  let shared
  let fn1, fn2
  let httpLambda = 'get /'
  let eventLambda = 'an-event'
  arc = parse(`@http\n${httpLambda}\n@events\n${eventLambda}`)
  pragmas = {
    http: populateHTTP({ arc, inventory }),
    events: populateEvents({ arc, inventory }),
    lambdaSrcDirs
  }

  mockFs({ 'foo/bar': {} })
  shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared.src, 'foo/bar', 'Got correct src dir back')
  t.equal(shared.shared.length, 2, 'Got correct number of lambdae with shared back')
  fn1 = pragmas.http.find(r => r.name === httpLambda)
  fn2 = pragmas.events.find(r => r.name === eventLambda)
  t.ok(shared.shared.includes(fn1.src), `Got shared lambda: ${httpLambda}`)
  t.ok(shared.shared.includes(fn2.src), `Got shared lambda: ${eventLambda}`)
  t.ok(fn1.config.shared, `Shared setting enabled in lambda: ${httpLambda}`)
  t.ok(fn2.config.shared, `Shared setting enabled in lambda: ${eventLambda}`)
  mockFs.restore()

  // Arc file wins
  arc = parse(`@http\n${httpLambda}\n@events\n${eventLambda}
@shared
src foo/baz`)
  pragmas = {
    http: populateHTTP({ arc, inventory }),
    events: populateEvents({ arc, inventory }),
    lambdaSrcDirs
  }

  mockFs({ 'foo/baz': {} })
  shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared.src, 'foo/baz', 'Got correct src dir back')
  t.equal(shared.shared.length, 2, 'Got correct number of lambdae with shared back')
  fn1 = pragmas.http.find(r => r.name === httpLambda)
  fn2 = pragmas.events.find(r => r.name === eventLambda)
  t.ok(shared.shared.includes(fn1.src), `Got shared lambda: ${httpLambda}`)
  t.ok(shared.shared.includes(fn2.src), `Got shared lambda: ${eventLambda}`)
  t.ok(fn1.config.shared, `Shared setting enabled in lambda: ${httpLambda}`)
  t.ok(fn2.config.shared, `Shared setting enabled in lambda: ${eventLambda}`)
  mockFs.restore()

  // cwd isn't concatenated when an absolute file path is returned
  let src = join(inventory._project.cwd, 'foo', 'bar')
  setter = () => ({ src })
  inventory.plugins = setterPluginSetup(setter)
  arc = parse(`@http\n${httpLambda}`)
  pragmas = {
    http: populateHTTP({ arc, inventory }),
    lambdaSrcDirs
  }
  mockFs({ 'foo/bar': {} })
  shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared.src, src, 'Got correct src dir back')
  t.equal(shared.shared.length, 1, 'Got correct number of lambdae with shared back')
  fn1 = pragmas.http.find(r => r.name === httpLambda)
  t.ok(shared.shared.includes(fn1.src), `Got shared lambda: ${httpLambda}`)
  t.ok(fn1.config.shared, `Shared setting enabled in lambda: ${httpLambda}`)
  mockFs.restore()
})

test(`@shared population: lambdae not explicitly defined have shared disabled (with src setting)`, t => {
  t.plan(8)
  let inventory = inventoryDefaults()
  let arc
  let pragmas
  let httpLambda = 'get /'
  let eventLambda = 'an-event'
  let queueLambda = 'a-queue'
  arc = parse(`@http
${httpLambda}
@events
${eventLambda}
@queues
${queueLambda}
@shared
http
  get /
events
  an-event
src foo/bar`)
  pragmas = {
    http: populateHTTP({ arc, inventory }),
    events: populateEvents({ arc, inventory }),
    queues: populateQueues({ arc, inventory }),
    lambdaSrcDirs
  }

  mockFs({ 'foo/bar': {} })
  let shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared.src, 'foo/bar', 'Got correct src dir back')
  t.equal(shared.shared.length, 2, 'Got correct number of lambdae with shared back')
  let fn1 = pragmas.http.find(r => r.name === httpLambda)
  let fn2 = pragmas.events.find(r => r.name === eventLambda)
  let fn3 = pragmas.queues.find(r => r.name === queueLambda)
  t.ok(shared.shared.includes(fn1.src), `Got shared lambda: ${httpLambda}`)
  t.ok(shared.shared.includes(fn2.src), `Got shared lambda: ${eventLambda}`)
  t.notOk(shared.shared.includes(fn3.src), `Did not get lambda: ${queueLambda}`)
  t.ok(fn1.config.shared, `Shared setting enabled in lambda: ${httpLambda}`)
  t.ok(fn2.config.shared, `Shared setting enabled in lambda: ${eventLambda}`)
  t.notOk(fn3.config.shared, `Shared setting not enabled in lambda: ${queueLambda}`)
  mockFs.restore()
})

test('@shared: validation errors', t => {
  t.plan(11)
  let arc
  let pragmas
  let errors
  let inventory = inventoryDefaults()
  let updatePragmas = () => {
    pragmas = { http: populateHTTP({ arc, inventory }), lambdaSrcDirs }
  }

  arc = parse(`@http
get /foo
@shared
http
  put /bar`)
  errors = []
  updatePragmas()
  mockFs({ 'src/shared': {} })
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared lambda not found in corresponding pragma errored')
  mockFs.restore()

  arc = parse(`@http
get /foo
@shared
hi`)
  errors = []
  updatePragmas()
  mockFs({ 'src/shared': {} })
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared invalid entry errored')
  mockFs.restore()

  arc = parse(`@http
get /foo
@shared
static
  foo`)
  errors = []
  updatePragmas()
  mockFs({ 'src/shared': {} })
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared invalid pragma errored')
  mockFs.restore()

  arc = parse(`@http
get /foo
@shared
src foo`)
  errors = []
  updatePragmas()
  mockFs({})
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src dir must exist')
  mockFs.restore()

  arc = parse(`@http
get /foo
@shared
src foo`)
  errors = []
  updatePragmas()
  mockFs({ foo: 'hi!' })
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src must refer to a dir, not a file')
  mockFs.restore()

  // From here on out we haven't needed to mock the filesystem since it should be returning errors prior to any folder existence checks; of course, update if that changes!
  arc = parse(`@http
get /foo
@shared
src src/index.js`)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src must be a directory')

  arc = parse(`@http
get /foo
@shared
src .`)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src cannot be .')

  arc = parse(`@http
get /foo
@shared
src ./`)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src cannot be ./')

  arc = parse(`@http
get /foo
@shared
src ..`)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src cannot be ..')

  arc = parse(`@http
get /foo
@shared
src ../`)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src cannot be ../')

  arc = parse(`@http
get /foo
@shared
src true`)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src must be a string')
})

test('@shared: plugin errors', t => {
  t.plan(8)
  let arc = parse(`@http\nget /foo`)
  let pragmas
  let errors
  let setter
  let inventory = inventoryDefaults()
  let updatePragmas = () => {
    pragmas = { http: populateHTTP({ arc, inventory }), lambdaSrcDirs }
  }

  setter = () => ({ src: 'hi' })
  inventory.plugins = setterPluginSetup(setter)
  errors = []
  updatePragmas()
  mockFs({ 'src/shared': {} })
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src dir must exist')
  mockFs.restore()

  setter = () => ({ src: 'foo' })
  inventory.plugins = setterPluginSetup(setter)
  errors = []
  updatePragmas()
  mockFs({ foo: 'hi!' })
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src must refer to a dir, not a file')
  mockFs.restore()

  // From here on out we haven't needed to mock the filesystem since it should be returning errors prior to any folder existence checks; of course, update if that changes!
  setter = () => ({ src: 'src/index.js' })
  inventory.plugins = setterPluginSetup(setter)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src must be a directory')

  setter = () => ({ src: '.' })
  inventory.plugins = setterPluginSetup(setter)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src cannot be .')

  setter = () => ({ src: './' })
  inventory.plugins = setterPluginSetup(setter)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src cannot be ./')

  setter = () => ({ src: '..' })
  inventory.plugins = setterPluginSetup(setter)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src cannot be ..')

  setter = () => ({ src: '../' })
  inventory.plugins = setterPluginSetup(setter)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src cannot be ../')

  setter = () => ({ src: true })
  inventory.plugins = setterPluginSetup(setter)
  errors = []
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src must be a string')
})

test('@shared other settings ignored', t => {
  t.plan(1)
  let arc
  let pragmas
  let errors
  let inventory = inventoryDefaults()

  arc = parse(`@http
get /foo
@shared
idk whatev`)
  pragmas = {
    http: populateHTTP({ arc, inventory }), lambdaSrcDirs
  }
  errors = []
  populateShared({ arc, pragmas, inventory, errors })
  t.notOk(errors.length, '@shared ignores unknown settings')
})
