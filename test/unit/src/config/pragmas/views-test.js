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
inventory.project.src = process.cwd()

test('Set up env', t => {
  t.plan(1)
  t.ok(populateViews, '@views populator is present')
})

test('No @http returns null @views', t => {
  t.plan(1)
  t.equal(populateViews({ arc: {} }), null, 'Returned null')
})

test('Arc Static Asset Proxy is not included in @views', t => {
  t.plan(3)
  let arc
  let pragmas
  arc = parse(`@http`)
  pragmas = { http: populateHTTP({ arc, inventory }) }
  t.equal(populateViews({ arc, pragmas }), null, 'Returned null')

  arc = parse(`@http
get /foo
@views
get /*`)
  pragmas = { http: populateHTTP({ arc, inventory }) }
  populateViews({ arc, pragmas })
  let asap = pragmas.http.find(r => r.name === 'get /*')
  t.ok(asap.arcStaticAssetProxy, 'Got back ASAP')
  t.notOk(asap.config.views, `Views setting not enabled in ASAP`)
})

test(`@views population: defaults only to 'get' + 'any' routes`, t => {
  t.plan(6)
  let arc
  let pragmas
  let values = [ 'get /', 'any /whatever', 'post /' ]
  arc = parse(`@http\n${values.join('\n')}`)
  pragmas = { http: populateHTTP({ arc, inventory }) }

  let views = populateViews({ arc, pragmas })
  t.equal(views.length, 2, 'Got correct number of routes with views back')
  values.forEach(val => {
    let route = pragmas.http.find(r => r.name === val)
    if (val !== values[2]) {
      t.ok(views.some(route => route === val), `Got views route: ${val}`)
      t.ok(route.config.views, `Views setting enabled in route: ${val}`)
    }
    else {
      t.notOk(route.config.views, `Views setting not enabled in route: ${val}`)
    }
  })
})

test(`@views population: views disabled when explicit routes are specified`, t => {
  t.plan(5)
  let arc
  let pragmas
  let values = [ 'get /', 'any /whatever', 'post /' ]
  arc = parse(`@http
${values.join('\n')}
@views
post /`)
  pragmas = { http: populateHTTP({ arc, inventory }) }

  let views = populateViews({ arc, pragmas })
  t.equal(views.length, 1, 'Got correct number of routes with views back')
  values.forEach(val => {
    let route = pragmas.http.find(r => r.name === val)
    if (val === values[2]) {
      t.ok(views.some(route => route === val), `Got views route: ${val}`)
      t.ok(route.config.views, `Views setting enabled in route: ${val}`)
    }
    else {
      t.notOk(route.config.views, `Views setting not enabled in route: ${val}`)
    }
  })
})

test('@views errors', t => {
  t.plan(2)
  t.throws(() => {
    populateViews({ arc: { views: [] } })
  }, '@views without @http throws')

  let arc = parse(`@http
get /foo
@views
put /bar`)
  let pragmas = { http: populateHTTP({ arc, inventory }) }
  t.throws(() => {
    populateViews({ arc, pragmas })
  }, '@views route not found in @http throws')
})
