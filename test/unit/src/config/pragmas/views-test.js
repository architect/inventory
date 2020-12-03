let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let populateHTTPPath = join(process.cwd(), 'src', 'config', 'pragmas', 'http')
let populateHTTP = require(populateHTTPPath)
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'views')
let populateViews = require(sut)
let inventory = inventoryDefaults()
let mockFs = require('mock-fs')
let cwd = inventory._project.src = process.cwd()

test('Set up env', t => {
  t.plan(1)
  t.ok(populateViews, '@views populator is present')
})

test('No @http returns null @views', t => {
  t.plan(1)
  t.equal(populateViews({ arc: {} }), null, 'Returned null')
})

test('@views is null if src/views not present', t => {
  t.plan(1)
  let arc
  let pragmas
  arc = parse(`@http`)
  pragmas = { http: populateHTTP({ arc, inventory }) }
  let views = populateViews({ arc, pragmas, inventory })
  t.equal(views, null, 'Returned null')
})

test('Default dir is src/views (if present)', t => {
  t.plan(2)
  let arc
  let pragmas
  arc = parse(`@http`)
  pragmas = { http: populateHTTP({ arc, inventory }) }
  mockFs({ 'src/views': {} })
  let views = populateViews({ arc, pragmas, inventory })
  mockFs.restore()
  t.equal(views.src, join(cwd, 'src', 'views'), 'Returned correct default dir')
  t.deepEqual(views.views, [], 'Returned empty views array')
})

test('Arc Static Asset Proxy is not included in @views', t => {
  t.plan(3)
  let arc
  let pragmas
  arc = parse(`@http`)
  pragmas = { http: populateHTTP({ arc, inventory }) }

  arc = parse(`@http
get /foo
@views
get /*`)
  pragmas = { http: populateHTTP({ arc, inventory }) }
  mockFs({ 'src/views': {} })
  let views = populateViews({ arc, pragmas, inventory })
  mockFs.restore()
  t.deepEqual(views.views, [], 'Returned empty views array')
  let asap = pragmas.http.find(r => r.name === 'get /*')
  t.ok(asap.arcStaticAssetProxy, 'Got back ASAP')
  t.notOk(asap.config.views, `Views setting not enabled in ASAP`)
})

test(`@views population: defaults only to 'get' + 'any' routes (without @views)`, t => {
  t.plan(6)
  let arc
  let pragmas
  let values = [ 'get /', 'any /whatever', 'post /' ]
  arc = parse(`@http\n${values.join('\n')}`)
  pragmas = { http: populateHTTP({ arc, inventory }) }

  mockFs({ 'src/views': {} })
  let views = populateViews({ arc, pragmas, inventory })
  mockFs.restore()
  t.equal(views.views.length, 2, 'Got correct number of routes with views back')
  values.forEach(val => {
    let route = pragmas.http.find(r => r.name === val)
    if (val !== values[2]) {
      t.ok(views.views.includes(route.src), `Got views route: ${val}`)
      t.ok(route.config.views, `Views setting enabled in route: ${val}`)
    }
    else {
      t.notOk(route.config.views, `Views setting not enabled in route: ${val}`)
    }
  })
})

test(`@views population: defaults only to 'get' + 'any' routes (with empty @views)`, t => {
  t.plan(6)
  let arc
  let pragmas
  let values = [ 'get /', 'any /whatever', 'post /' ]
  arc = parse(`@http\n${values.join('\n')}\n@views`)
  pragmas = { http: populateHTTP({ arc, inventory }) }

  mockFs({ 'src/views': {} })
  let views = populateViews({ arc, pragmas, inventory })
  mockFs.restore()
  t.equal(views.views.length, 2, 'Got correct number of routes with views back')
  values.forEach(val => {
    let route = pragmas.http.find(r => r.name === val)
    if (val !== values[2]) {
      t.ok(views.views.includes(route.src), `Got views route: ${val}`)
      t.ok(route.config.views, `Views setting enabled in route: ${val}`)
    }
    else {
      t.notOk(route.config.views, `Views setting not enabled in route: ${val}`)
    }
  })
})

test(`@views population: defaults only to 'get' + 'any' routes (with src setting)`, t => {
  t.plan(7)
  let arc
  let pragmas
  let values = [ 'get /', 'any /whatever', 'post /' ]
  arc = parse(`@http
${values.join('\n')}
@views
src foo/bar`)
  pragmas = { http: populateHTTP({ arc, inventory }) }

  mockFs({ 'foo/bar': {} })
  let views = populateViews({ arc, pragmas, inventory })
  mockFs.restore()
  t.equal(views.src, 'foo/bar', 'Got correct src dir back')
  t.equal(views.views.length, 2, 'Got correct number of routes with views back') // `POST /` is not a view
  values.forEach(val => {
    let route = pragmas.http.find(r => r.name === val)
    if (val !== values[2]) {
      t.ok(views.views.includes(route.src), `Got views route: ${val}`)
      t.ok(route.config.views, `Views setting enabled in route: ${val}`)
    }
    else {
      t.notOk(route.config.views, `Views setting not enabled in route: ${val}`)
    }
  })
})

test(`@views population: routes not explicitly defined have views disabled (with src setting)`, t => {
  t.plan(6)
  let arc
  let pragmas
  let values = [ 'get /', 'any /whatever', 'post /' ]
  arc = parse(`@http
${values.join('\n')}
@views
post /
src foo/bar`)
  pragmas = { http: populateHTTP({ arc, inventory }) }

  mockFs({ 'foo/bar': {} })
  let views = populateViews({ arc, pragmas, inventory })
  mockFs.restore()
  t.equal(views.src, 'foo/bar', 'Got correct src dir back')
  t.equal(views.views.length, 1, 'Got correct number of routes with views back')
  values.forEach(val => {
    let route = pragmas.http.find(r => r.name === val)
    if (val === values[2]) {
      t.ok(views.views.includes(route.src), `Got views route: ${val}`)
      t.ok(route.config.views, `Views setting enabled in route: ${val}`)
    }
    else {
      t.notOk(route.config.views, `Views setting not enabled in route: ${val}`)
    }
  })
})

test('@views errors', t => {
  t.plan(7)
  let arc
  let pragmas

  t.throws(() => {
    populateViews({ arc: { views: [] } })
  }, '@views without @http throws')

  arc = parse(`@http
get /foo
@views
put /bar`)
  pragmas = { http: populateHTTP({ arc, inventory }) }
  t.throws(() => {
    populateViews({ arc, pragmas, inventory })
  }, '@views route not found in @http throws')

  arc = parse(`@http
get /foo
@views
src src/index.js`)
  pragmas = { http: populateHTTP({ arc, inventory }) }
  t.throws(() => {
    populateViews({ arc, pragmas, inventory })
  }, '@views src must be a directory')

  arc = parse(`@http
get /foo
@views
src .`)
  pragmas = { http: populateHTTP({ arc, inventory }) }
  t.throws(() => {
    populateViews({ arc, pragmas, inventory })
  }, '@views cannot be .')

  arc = parse(`@http
get /foo
@views
src ./`)
  pragmas = { http: populateHTTP({ arc, inventory }) }
  t.throws(() => {
    populateViews({ arc, pragmas, inventory })
  }, '@views cannot be ./')

  arc = parse(`@http
get /foo
@views
src ..`)
  pragmas = { http: populateHTTP({ arc, inventory }) }
  t.throws(() => {
    populateViews({ arc, pragmas, inventory })
  }, '@views cannot be ..')

  arc = parse(`@http
get /foo
@views
src ../`)
  pragmas = { http: populateHTTP({ arc, inventory }) }
  t.throws(() => {
    populateViews({ arc, pragmas, inventory })
  }, '@views cannot be ../')
})
