let { join } = require('path')
let mockTmp = require('mock-tmp')
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
  let cwd = mockTmp({ 'src/shared': {} })
  let inventory = inventoryDefaults({ cwd })
  let arc
  let pragmas
  arc = parse(`@http`)
  pragmas = { http: populateHTTP({ arc, inventory }), lambdaSrcDirs }

  let shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared.src, join(cwd, 'src', 'shared'), 'Returned correct default dir')
  t.deepEqual(shared.shared, [], 'Returned empty shared array')
  mockTmp.reset()
})

test('Arc Static Asset Proxy is not included in @shared', t => {
  t.plan(4)
  let cwd = mockTmp({ 'src/shared': {} })
  let inventory = inventoryDefaults({ cwd })
  let arc
  let pragmas
  arc = parse(`@http
get /foo
@shared
http
  get /*`)
  pragmas = { http: populateHTTP({ arc, inventory }), lambdaSrcDirs }

  let shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared.src, join(cwd, 'src', 'shared'), 'Returned correct default dir')
  t.deepEqual(shared.shared, [], 'Returned empty shared array')
  let asap = pragmas.http.find(r => r.name === 'get /*')
  t.ok(asap.arcStaticAssetProxy, 'Got back ASAP')
  t.notOk(asap.config.shared, `Shared setting not enabled in ASAP`)
  mockTmp.reset()
})

test(`@shared population: defaults to enabled (without @shared)`, t => {
  t.plan(6)
  let cwd = mockTmp({ 'src/shared': {} })
  let inventory = inventoryDefaults({ cwd })
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

  let shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared.src, join(cwd, 'src', 'shared'), 'Returned correct default dir')
  t.equal(shared.shared.length, 2, 'Got correct number of lambdae with shared back')
  let fn1 = pragmas.http.find(r => r.name === httpLambda)
  let fn2 = pragmas.events.find(r => r.name === eventLambda)
  t.ok(shared.shared.includes(fn1.src), `Got shared lambda: ${httpLambda}`)
  t.ok(shared.shared.includes(fn2.src), `Got shared lambda: ${eventLambda}`)
  t.ok(fn1.config.shared, `Shared setting enabled in lambda: ${httpLambda}`)
  t.ok(fn2.config.shared, `Shared setting enabled in lambda: ${eventLambda}`)
  mockTmp.reset()
})

test(`@shared population: defaults to enabled (with empty @shared)`, t => {
  t.plan(6)
  let cwd = mockTmp({ 'src/shared': {} })
  let inventory = inventoryDefaults({ cwd })
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

  let shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared.src, join(cwd, 'src', 'shared'), 'Returned correct default dir')
  t.equal(shared.shared.length, 2, 'Got correct number of lambdae with shared back')
  let fn1 = pragmas.http.find(r => r.name === httpLambda)
  let fn2 = pragmas.events.find(r => r.name === eventLambda)
  t.ok(shared.shared.includes(fn1.src), `Got shared lambda: ${httpLambda}`)
  t.ok(shared.shared.includes(fn2.src), `Got shared lambda: ${eventLambda}`)
  t.ok(fn1.config.shared, `Shared setting enabled in lambda: ${httpLambda}`)
  t.ok(fn2.config.shared, `Shared setting enabled in lambda: ${eventLambda}`)
  mockTmp.reset()
})

test(`@shared population: defaults to enabled (with src setting)`, t => {
  t.plan(6)
  let cwd = mockTmp({ 'foo/bar': {} })
  let inventory = inventoryDefaults({ cwd })
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

  let shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared.src, 'foo/bar', 'Got correct src dir back')
  t.equal(shared.shared.length, 2, 'Got correct number of lambdae with shared back')
  let fn1 = pragmas.http.find(r => r.name === httpLambda)
  let fn2 = pragmas.events.find(r => r.name === eventLambda)
  t.ok(shared.shared.includes(fn1.src), `Got shared lambda: ${httpLambda}`)
  t.ok(shared.shared.includes(fn2.src), `Got shared lambda: ${eventLambda}`)
  t.ok(fn1.config.shared, `Shared setting enabled in lambda: ${httpLambda}`)
  t.ok(fn2.config.shared, `Shared setting enabled in lambda: ${eventLambda}`)
  mockTmp.reset()
})

test(`@shared population: plugin setter`, t => {
  t.plan(20)
  let setter = () => ({ src: 'foo/bar' })

  let arc
  let cwd
  let inventory
  let pragmas
  let shared
  let fn1, fn2
  let httpLambda = 'get /'
  let eventLambda = 'an-event'

  // Basic plugin stuff
  cwd = mockTmp({ 'foo/bar': {} })
  inventory = inventoryDefaults({ cwd })
  inventory.plugins = setterPluginSetup(setter)

  arc = parse(`@http\n${httpLambda}\n@events\n${eventLambda}`)
  pragmas = {
    http: populateHTTP({ arc, inventory }),
    events: populateEvents({ arc, inventory }),
    lambdaSrcDirs
  }

  shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared.src, 'foo/bar', 'Got correct src dir back')
  t.equal(shared.shared.length, 2, 'Got correct number of lambdae with shared back')
  fn1 = pragmas.http.find(r => r.name === httpLambda)
  fn2 = pragmas.events.find(r => r.name === eventLambda)
  t.ok(shared.shared.includes(fn1.src), `Got shared lambda: ${httpLambda}`)
  t.ok(shared.shared.includes(fn2.src), `Got shared lambda: ${eventLambda}`)
  t.ok(fn1.config.shared, `Shared setting enabled in lambda: ${httpLambda}`)
  t.ok(fn2.config.shared, `Shared setting enabled in lambda: ${eventLambda}`)
  mockTmp.reset()

  // Fall back to src/shared if specified dir is not found
  cwd = mockTmp({ 'src/shared': {} })
  inventory = inventoryDefaults({ cwd })
  inventory.plugins = setterPluginSetup(setter)

  arc = parse(`@http\n${httpLambda}\n@events\n${eventLambda}`)
  pragmas = {
    http: populateHTTP({ arc, inventory }),
    events: populateEvents({ arc, inventory }),
    lambdaSrcDirs
  }
  shared = populateShared({ arc, pragmas, inventory })
  t.ok(shared.src.endsWith(join('src', 'shared')), 'Got correct src dir back')
  t.equal(shared.shared.length, 2, 'Got correct number of lambdae with shared back')
  mockTmp.reset()

  // Shared is null if setter doesn't set `required` flag and no dirs are found
  cwd = mockTmp({ 'foo/bar': {} })
  inventory = inventoryDefaults({ cwd })
  inventory.plugins = setterPluginSetup(setter)

  arc = parse(`@http\n${httpLambda}\n@events\n${eventLambda}`)
  pragmas = {
    http: populateHTTP({ arc, inventory }),
    events: populateEvents({ arc, inventory }),
    lambdaSrcDirs
  }
  // Just a control test!
  shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared.src, 'foo/bar', 'Got correct src dir back')
  mockTmp.reset()
  shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared, null, 'shared is null')
  mockTmp.reset()

  // Arc file wins
  cwd = mockTmp({ 'foo/baz': {} })
  inventory = inventoryDefaults({ cwd })
  inventory.plugins = setterPluginSetup(setter)

  arc = parse(`@http\n${httpLambda}\n@events\n${eventLambda}
@shared
  src foo/baz`)
  pragmas = {
    http: populateHTTP({ arc, inventory }),
    events: populateEvents({ arc, inventory }),
    lambdaSrcDirs
  }
  shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared.src, 'foo/baz', 'Got correct src dir back')
  t.equal(shared.shared.length, 2, 'Got correct number of lambdae with shared back')
  fn1 = pragmas.http.find(r => r.name === httpLambda)
  fn2 = pragmas.events.find(r => r.name === eventLambda)
  t.ok(shared.shared.includes(fn1.src), `Got shared lambda: ${httpLambda}`)
  t.ok(shared.shared.includes(fn2.src), `Got shared lambda: ${eventLambda}`)
  t.ok(fn1.config.shared, `Shared setting enabled in lambda: ${httpLambda}`)
  t.ok(fn2.config.shared, `Shared setting enabled in lambda: ${eventLambda}`)
  mockTmp.reset()

  // cwd isn't concatenated when an absolute file path is returned
  cwd = mockTmp({ 'foo/bar': {} })
  inventory = inventoryDefaults({ cwd })
  inventory.plugins = setterPluginSetup(setter)

  let src = join(inventory._project.cwd, 'foo', 'bar')
  setter = () => ({ src })
  inventory.plugins = setterPluginSetup(setter)
  arc = parse(`@http\n${httpLambda}`)
  pragmas = {
    http: populateHTTP({ arc, inventory }),
    lambdaSrcDirs
  }
  shared = populateShared({ arc, pragmas, inventory })
  t.equal(shared.src, src, 'Got correct src dir back')
  t.equal(shared.shared.length, 1, 'Got correct number of lambdae with shared back')
  fn1 = pragmas.http.find(r => r.name === httpLambda)
  t.ok(shared.shared.includes(fn1.src), `Got shared lambda: ${httpLambda}`)
  t.ok(fn1.config.shared, `Shared setting enabled in lambda: ${httpLambda}`)
  mockTmp.reset()
})

test(`@shared population: lambdae not explicitly defined have shared disabled (with src setting)`, t => {
  t.plan(8)
  let cwd = mockTmp({ 'foo/bar': {} })
  let inventory = inventoryDefaults({ cwd })
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
  mockTmp.reset()
})

test('@shared: validation errors', t => {
  t.plan(11)
  let arc
  let cwd
  let pragmas
  let errors
  let inventory
  let updatePragmas = () => {
    pragmas = { http: populateHTTP({ arc, inventory }), lambdaSrcDirs }
  }

  cwd = mockTmp({ 'src/shared': {} })
  inventory = inventoryDefaults({ cwd })
  arc = parse(`@http
get /foo
@shared
http
  put /bar`)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared lambda not found in corresponding pragma errored')
  mockTmp.reset()

  cwd = mockTmp({ 'src/shared': {} })
  inventory = inventoryDefaults({ cwd })
  arc = parse(`@http
get /foo
@shared
hi`)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared invalid entry errored')
  mockTmp.reset()

  cwd = mockTmp({ 'src/shared': {} })
  inventory = inventoryDefaults({ cwd })
  arc = parse(`@http
get /foo
@shared
static
  foo`)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared invalid pragma errored')
  mockTmp.reset()

  arc = parse(`@http
get /foo
@shared
src foo`)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src dir must exist')

  cwd = mockTmp({ foo: 'hi!' })
  inventory = inventoryDefaults({ cwd })
  arc = parse(`@http
get /foo
@shared
src foo`)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src must refer to a dir, not a file')

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
  t.plan(9)
  let arc
  let cwd
  let pragmas
  let errors
  let setter
  let inventory
  let updatePragmas = () => {
    pragmas = { http: populateHTTP({ arc, inventory }), lambdaSrcDirs }
  }

  cwd = mockTmp({ foo: {}, hi: {} })
  inventory = inventoryDefaults({ cwd })
  arc = parse(`@http\nget /foo\n@shared\nsrc foo`)
  setter = () => ({ src: 'hi', required: true })
  inventory.plugins = setterPluginSetup(setter)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors[0], '@shared src setting conflicts with plugin', '@shared src dir must exist if required flag is set')
  mockTmp.reset()

  arc = parse(`@http\nget /foo`)
  inventory.plugins = setterPluginSetup(setter)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors[0], 'Directory not found: hi', '@shared src dir must exist if required flag is set')

  cwd = mockTmp({ foo: 'hi!' })
  inventory = inventoryDefaults({ cwd })
  setter = () => ({ src: 'foo' })
  inventory.plugins = setterPluginSetup(setter)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src must refer to a dir, not a file')
  mockTmp.reset()

  cwd = mockTmp({ 'src/index.js': '// hi!' })
  inventory = inventoryDefaults({ cwd })
  setter = () => ({ src: 'src/index.js' })
  inventory.plugins = setterPluginSetup(setter)
  errors = []
  updatePragmas()
  populateShared({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@shared src must be a directory')
  mockTmp.reset()

  // From here on out we haven't needed to mock the filesystem since it should be returning errors prior to any folder existence checks; of course, update if that changes!
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
