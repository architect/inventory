let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let getLambdaNamePath = join(process.cwd(), 'src', 'config', 'pragmas', 'populate-lambda', 'get-lambda-name')
let getLambdaName = require(getLambdaNamePath)
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'http')
let populateHTTP = require(sut)

let cwd = process.cwd()
let inventory = inventoryDefaults()
inventory.project.src = cwd
let httpDir = join(cwd, 'src', 'http')

test('Set up env', t => {
  t.plan(1)
  t.ok(populateHTTP, '@http Lambda populator is present')
})

test('No @http returns null', t => {
  t.plan(1)
  t.equal(populateHTTP({ arc: {}, inventory }), null, 'Returned null')
})

test('@http population via @static: implicit get /* (Arc Static Asset Proxy)', t => {
  // t.plan(2)
  let arc

  function check (arc, expected, expectASAP = false) {
    let http = populateHTTP({ arc, inventory })
    t.equal(http.length, expected, `Got expected number of routes back: ${expected}`)
    let asap = http.find(r => r.arcStaticAssetProxy)
    if (asap) {
      t.equal(asap.arcStaticAssetProxy, expectASAP, `Found Arc Static Asset Proxy root handler`)
    }
    else {
      t.equal(http[0].arcStaticAssetProxy, undefined, `Found explicitly defined root handler`)
    }
  }

  arc = parse(`@static`)
  check(arc, 1, true)

  arc = parse(`@http`)
  check(arc, 1, true)

  arc = parse(`@http
post /`)
  check(arc, 2, true)

  arc = parse(`@http
get /`)
  check(arc, 1)

  arc = parse(`@http
get /*`)
  check(arc, 1)

  arc = parse(`@http
get /:param`)
  check(arc, 1)

  arc = parse(`@http
any /`)
  check(arc, 1)

  arc = parse(`@http
any /*`)
  check(arc, 1)

  arc = parse(`@http
any /:param`)
  check(arc, 1)



  t.end()
})

test('@http population: simple format + implicit get /*', t => {
  t.plan(8)
  let values = [ 'get /foo', 'put /bar' ]
  let arc = parse(`
@http
${values.join('\n')}
`)
  let http = populateHTTP({ arc, inventory })
  t.equal(http.length, values.length + 1, 'Got correct number of routes back (including default get /)')
  values.forEach(val => {
    t.ok(http.some(route => route.name === val), `Got route: ${val}`)
  })
  http.forEach(route => {
    let name = `${route.method}${getLambdaName(route.path)}`
    if (route.name === 'get /*') {
      t.equal(route.arcStaticAssetProxy, true, 'Implicit get /* (ASAP) found')
    }
    else {
      t.equal(route.src, join(httpDir, name), `Route configured with correct source dir: ${route.src}`)
      t.ok(route.handlerFile.startsWith(route.src), `Handler file is in the correct source dir`)
    }
  })
})

test('@http population: simple format + explicit get /*', t => {
  t.plan(11)
  let values = [ 'get /*', 'get /foo', 'put /bar' ]
  let arc = parse(`
@http
${values.join('\n')}
`)
  let http = populateHTTP({ arc, inventory })
  t.equal(http.length, values.length, 'Got correct number of routes back')
  values.forEach(val => {
    t.ok(http.some(route => route.name === val), `Got route: ${val}`)
  })
  http.forEach(route => {
    let name = `${route.method}${getLambdaName(route.path)}`
    if (route.name === 'get /*') {
      t.notOk(route.arcStaticAssetProxy, 'Explicit get /* does not have truthy arcStaticAssetProxy param')
    }
    t.equal(route.src, join(httpDir, name), `Route configured with correct source dir: ${route.src}`)
    t.ok(route.handlerFile.startsWith(route.src), `Handler file is in the correct source dir`)
  })
})

test('@http population: complex format + implicit get /*', t => {
  t.plan(11)
  let values = [ 'foo', 'bar', 'baz' ]
  let complexValues = [
    `/${values[0]}
  method get
  src ${values[0]}/path`,
    `/${values[1]}
  method get
  src ${values[1]}/path`,
    `/${values[2]}
  method get
  src ${values[2]}/path`,
  ]
  let arc = parse(`
@http
${complexValues.join('\n')}
`)
  let http = populateHTTP({ arc, inventory })
  t.equal(http.length, values.length + 1, 'Got correct number of routes back')
  values.forEach(val => {
    t.ok(http.some(route => route.name === `get /${val}`), `Got route: ${val}`)
  })
  http.forEach(route => {
    if (route.name === 'get /*') {
      t.equal(route.arcStaticAssetProxy, true, 'Implicit get /* (ASAP) found')
    }
    else {
      t.equal(route.src, join(cwd, `${route.path}/path`), `Route configured with correct source dir: ${route.src}`)
      t.ok(route.handlerFile.startsWith(route.src), `Handler file is in the correct source dir`)
    }
  })
})

test('@http population: complex format + explicit get /*', t => {
  t.plan(13)
  let values = [ 'foo', 'bar', 'baz', '/*' ]
  let complexValues = [
    `/*
  method get
  src index/path`,
    `/${values[0]}
  method get
  src ${values[0]}/path`,
    `/${values[1]}
  method get
  src ${values[1]}/path`,
    `/${values[2]}
  method get
  src ${values[2]}/path`,
  ]
  let arc = parse(`
@http
${complexValues.join('\n')}
`)
  let http = populateHTTP({ arc, inventory })
  t.equal(http.length, values.length, 'Got correct number of routes back')
  values.forEach(val => {
    t.ok(http.some(route => route.name === `get /${val.replace('/', '')}`), `Got route: ${val}`)
  })
  http.forEach(route => {
    if (route.name === 'get /*') {
      t.notOk(route.arcStaticAssetProxy, 'Explicit get /* does not have truthy arcStaticAssetProxy param')
      t.equal(route.src, join(cwd, `index/path`), `Route configured with correct source dir: ${route.src}`)
    }
    else {
      t.equal(route.src, join(cwd, `${route.path}/path`), `Route configured with correct source dir: ${route.src}`)
      t.ok(route.handlerFile.startsWith(route.src), `Handler file is in the correct source dir`)
    }
  })
})

test('@http population: complex format + implicit get /* + fallback to default paths', t => {
  t.plan(11)
  let values = [ 'foo', 'bar', 'baz' ]
  let complexValues = [
    `/${values[0]}
  method get`,
    `/${values[1]}
  method get`,
    `/${values[2]}
  method get`,
  ]
  let arc = parse(`
@http
${complexValues.join('\n')}
`)
  let http = populateHTTP({ arc, inventory })
  t.equal(http.length, values.length + 1, 'Got correct number of routes back')
  values.forEach(val => {
    t.ok(http.some(route => route.name === `get /${val}`), `Got route: ${val}`)
  })
  http.forEach(route => {
    let name = `${route.method}${getLambdaName(route.path)}`
    if (route.name === 'get /*') {
      t.equal(route.arcStaticAssetProxy, true, 'Implicit get /* (ASAP) found')
    }
    else {
      t.equal(route.src, join(httpDir, name), `Complex HTTP entry fell back to correct default source dir: ${route.src}`)
      t.ok(route.handlerFile.startsWith(route.src), `Handler file is in the correct source dir`)
    }
  })
})

test('@http population: invalid paths throw', t => {
  t.plan(5)
  let arc

  arc = parse(`
@http
hi /there
`)
  t.throws(() => {
    populateHTTP({ arc, inventory })
  }, 'Invalid simple route threw')

  arc = parse(`
@http
get /hi-there!
`)
  t.throws(() => {
    populateHTTP({ arc, inventory })
  }, 'Invalid simple route threw')

  arc = parse(`
@http
/there
  method hi
`)
  t.throws(() => {
    populateHTTP({ arc, inventory })
  }, 'Invalid complex route threw')

  arc = parse(`
@http
/hi-there!
  method get
`)
  t.throws(() => {
    populateHTTP({ arc, inventory })
  }, 'Invalid complex route threw')

  arc = parse(`
@http
get /hi there
`)
  t.throws(() => {
    populateHTTP({ arc, inventory })
  }, 'Invalid weird array route threw')
})
