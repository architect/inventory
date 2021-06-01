let { join } = require('path')
let mockFs = require('mock-fs')
let parse = require('@architect/parser')
let test = require('tape')
let populateHTTPPath = join(process.cwd(), 'src', 'config', 'pragmas', 'http')
let populateHTTP = require(populateHTTPPath)
let populateEventsPath = join(process.cwd(), 'src', 'config', 'pragmas', 'events')
let populateEvents = require(populateEventsPath)
let populateQueuesPath = join(process.cwd(), 'src', 'config', 'pragmas', 'queues')
let populateQueues = require(populateQueuesPath)
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'shared')
let populateShared = require(sut)
let inventory = inventoryDefaults()
let cwd = inventory._project.src = process.cwd()
let lambdaSrcDirs = [] // Only needs to be truthy to test code path

test('Set up env', t => {
  t.plan(1)
  t.ok(populateShared, '@shared populator is present')
})

test('No Lambdae anywhere returns null @shared', t => {
  t.plan(1)
  t.deepEqual(populateShared({ arc: {}, pragmas: {}, inventory }), null, 'Returned null')
})

test('Project with any Lambdae get a default @shared object', t => {
  t.plan(1)
  let shared = populateShared({ arc: {}, pragmas: { lambdaSrcDirs }, inventory })
  t.equal(shared, null, 'Returned null')
})

test('Default dir is: src/shared (if present)', t => {
  t.plan(2)
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

test(`@shared population: lambdae not explicitly defined have shared disabled (with src setting)`, t => {
  t.plan(8)
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

test('@shared errors', t => {
  t.plan(9)
  let arc
  let pragmas
  let errors

  arc = parse(`@http
get /foo
@shared
http
  put /bar`)
  pragmas = {
    http: populateHTTP({ arc, inventory }), lambdaSrcDirs
  }
  errors = []
  populateShared({ arc, pragmas, inventory, errors })
  t.ok(errors.length, '@shared lambda not found in corresponding pragma errored')

  arc = parse(`@http
get /foo
@shared
hi`)
  pragmas = {
    http: populateHTTP({ arc, inventory }), lambdaSrcDirs
  }
  errors = []
  populateShared({ arc, pragmas, inventory, errors })
  t.ok(errors.length, '@shared invalid entry errored')

  arc = parse(`@http
get /foo
@shared
static
  foo`)
  pragmas = {
    http: populateHTTP({ arc, inventory }), lambdaSrcDirs
  }
  errors = []
  populateShared({ arc, pragmas, inventory, errors })
  t.ok(errors.length, '@shared invalid pragma errored')

  arc = parse(`@http
get /foo
@shared
src src/index.js`)
  pragmas = {
    http: populateHTTP({ arc, inventory }),
    lambdaSrcDirs
  }
  errors = []
  populateShared({ arc, pragmas, inventory, errors })
  t.ok(errors.length, '@shared src must be a directory')

  arc = parse(`@http
get /foo
@shared
src .`)
  pragmas = {
    http: populateHTTP({ arc, inventory }),
    lambdaSrcDirs
  }
  errors = []
  populateShared({ arc, pragmas, inventory, errors })
  t.ok(errors.length, '@shared src cannot be .')

  arc = parse(`@http
get /foo
@shared
src ./`)
  pragmas = {
    http: populateHTTP({ arc, inventory }),
    lambdaSrcDirs
  }
  errors = []
  populateShared({ arc, pragmas, inventory, errors })
  t.ok(errors.length, '@shared src cannot be ./')

  arc = parse(`@http
get /foo
@shared
src ..`)
  pragmas = {
    http: populateHTTP({ arc, inventory }),
    lambdaSrcDirs
  }
  errors = []
  populateShared({ arc, pragmas, inventory, errors })
  t.ok(errors.length, '@shared src cannot be ..')

  arc = parse(`@http
get /foo
@shared
src ../`)
  pragmas = {
    http: populateHTTP({ arc, inventory }),
    lambdaSrcDirs
  }
  errors = []
  populateShared({ arc, pragmas, inventory, errors })
  t.ok(errors.length, '@shared src cannot be ../')

  arc = parse(`@http
get /foo
@shared
src true`)
  pragmas = {
    http: populateHTTP({ arc, inventory }),
    lambdaSrcDirs
  }
  errors = []
  populateShared({ arc, pragmas, inventory, errors })
  t.ok(errors.length, '@shared src must be a string')
})


test('@shared other settings ignored', t => {
  t.plan(1)
  let arc
  let pragmas
  let errors

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
