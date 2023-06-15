let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let cwd = process.cwd()
let { getLambdaName } = require('@architect/utils')
let inventoryDefaultsPath = join(cwd, 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let testLibPath = join(cwd, 'test', 'lib')
let testLib = require(testLibPath)
let sut = join(cwd, 'src', 'config', 'pragmas', 'http')
let populateHTTP = require(sut)

let inventory = inventoryDefaults()
let httpDir = join(cwd, 'src', 'http')
let setterPluginSetup = testLib.setterPluginSetup.bind({}, 'http')

test('Set up env', t => {
  t.plan(1)
  t.ok(populateHTTP, '@http Lambda populator is present')
})

test('No @http returns null', t => {
  t.plan(1)
  t.equal(populateHTTP({ arc: {}, inventory }), null, 'Returned null')
})

test('@http population via @static: implicit get /* (Arc Static Asset Proxy)', t => {
  t.plan(85)
  let arc

  function check (arc, expected, expectedRootHandler) {
    let inventory = inventoryDefaults()
    let http = populateHTTP({ arc, inventory })
    let result = http === null ? http : http.length
    t.equal(result, expected, `Got expected number of routes back: ${expected}`)
    if (expectedRootHandler === 'arcStaticAssetProxy') {
      let asap = http.find(r => r.arcStaticAssetProxy)
      t.equal(asap.name, 'get /*', `ASAP is 'get /*`)
      t.ok(asap.src, `Found Arc Static Asset Proxy dist src`)
      t.equal(asap.handlerFile, join(asap.src, 'index.js'), `Found Arc Static Asset Proxy dist handler file`)
      t.equal(asap.handlerMethod, 'handler', `Found Arc Static Asset Proxy dist handler method`)
      t.equal(asap.arcStaticAssetProxy, true, `Found Arc Static Asset Proxy root handler`)
      t.ok(asap.config, `Found Arc Static Asset Proxy config`)
      t.equal(asap.config.shared, false, 'Arc Static Asset Proxy has disabled shared files')
      t.equal(asap.config.views, false, 'Arc Static Asset Proxy has disabled shared views')
      t.deepEqual(asap.config.layers, [], 'Arc Static Asset Proxy has no layers')
      t.equal(asap.pragma, 'http', `Found Arc Static Asset Proxy @http pragma`)
      t.equal(asap.method, 'get', `Found Arc Static Asset Proxy http method`)
      t.equal(asap.path, '/*', `Found Arc Static Asset Proxy http path`)
      t.equal(inventory._project.rootHandler, expectedRootHandler, '_project.rootHandler set to: arcStaticAssetProxy')
      t.ok(inventory._project.asapSrc, '_project.asapSrc set')
    }
    else if (expectedRootHandler) {
      // Most cases: some HTTP routes
      if (http.length) {
        t.equal(http[0].arcStaticAssetProxy, undefined, `Found explicitly defined root handler`)
      }
      // Bare @proxy and no routes
      else {
        t.equal(http.length, expected, `Found correct number of roots: ${expected}`)
      }
      t.equal(inventory._project.rootHandler, expectedRootHandler, `_project.rootHandler set to: ${expectedRootHandler}`)
    }
    else {
      t.equal(result, null, 'Did not populate @http')
    }
  }

  arc = parse(`@nada`)
  check(arc, null)

  arc = parse(`@static`)
  check(arc, null)

  arc = parse(`@static\n@http`)
  check(arc, 1, 'arcStaticAssetProxy')

  arc = parse(`@http`)
  check(arc, 1, 'arcStaticAssetProxy')

  arc = parse(`@http
post /`)
  check(arc, 2, 'arcStaticAssetProxy')

  // Find the root user-configured handler
  arc = parse(`@http
get /`)
  check(arc, 1, 'get /')

  arc = parse(`@http
get /*`)
  check(arc, 1, 'get /*')

  arc = parse(`@http
get /:param`)
  check(arc, 1, 'get /:param')

  arc = parse(`@http
any /`)
  check(arc, 1, 'any /')

  arc = parse(`@http
any /*`)
  check(arc, 1, 'any /*')

  arc = parse(`@http
any /:param`)
  check(arc, 1, 'any /:param')

  // `get /` always wins
  arc = parse(`@http
any /*
get /
any /`)
  check(arc, 3, 'get /')

  // root wins over method
  arc = parse(`@http
any /:foo
get /*
any /`)
  check(arc, 3, 'any /')

  // `get` wins over `any`
  arc = parse(`@http
any /*
get /*
get /whatev`)
  check(arc, 3, 'get /*')

  // `get` wins over `any` even with diff kinds of greedy route
  arc = parse(`@http
any /*
get /:foo
get /whatev`)
  check(arc, 3, 'get /:foo')

  // Proxy
  arc = parse(`@http
@proxy
testing https://some.site
staging https://some.site
proxuction https://some.site`)
  check(arc, 0, 'proxy')

  arc = parse(`@http
post /
@proxy
testing https://some.site
staging https://some.site
proxuction https://some.site`)
  check(arc, 1, 'proxy')
})

test('@http population: simple format + implicit get /*', t => {
  t.plan(8)

  let values = [ 'get /foo', 'put /bar' ]
  let arc = parse(`
@http
${values.join('\n')}
`)
  let http = populateHTTP({ arc, inventory })
  t.equal(http.length, values.length + 1, 'Got correct number of routes back (including default get /*)')
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

test('@http population: plugin setter', t => {
  t.plan(8)

  let values = [ 'get /foo', 'put /bar' ]
  let inventory = inventoryDefaults()
  let setter = () => values.map(v => {
    let bits = v.split(' ')
    let method = bits[0]
    let path = bits[1]
    let folder = `${method}${getLambdaName(path)}`
    return { method, path, src: join(httpDir, folder) }
  })
  inventory.plugins = setterPluginSetup(setter)
  let http = populateHTTP({ arc: {}, inventory })

  t.equal(http.length, values.length + 1, 'Got correct number of routes back (including default get /*)')
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

test('@http population: plugin setter respects custom config', t => {
  t.plan(20)

  let inventory = inventoryDefaults()
  let configs = {
    'get /foo': {
      shared: true,
      views: true,
      runtime: 'python3.9',
      timeout: 11,
      memory: 1337,
      storage: 1024,
    },
    'get /bar': {
      shared: false,
      views: false,
      runtime: 'nodejs14.x',
      timeout: 12,
      memory: 1338,
      storage: 1025,
    },
  }
  let values = Object.keys(configs)
  let setter = () => values.map(v => {
    let bits = v.split(' ')
    let method = bits[0]
    let path = bits[1]
    let folder = `${method}${getLambdaName(path)}`
    return { method, path, src: join(httpDir, folder), config: configs[v] }
  })
  inventory.plugins = setterPluginSetup(setter)
  let http = populateHTTP({ arc: {}, inventory })

  t.equal(http.length, values.length + 1, 'Got correct number of routes back (including default get /*)')
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
      Object.entries(configs[route.name]).forEach(([ option, setting ]) => {
        t.equal(route.config[option], setting, `Plugin config setting '${option}' is correct: ${setting}`)
      })
    }
  })
})

test('@http population: route sorting', t => {
  t.plan(2)
  let desiredOrder = [
    /* get */
    // 6 positions
    'get /api/items/:item/fidget/rofl/propA',
    'get /api/items/:item/widget/:idk/propA',
    'get /api/items/:item/:idk/lol/propA',
    'get /api/items/:item/:wtf/omg/propA',
    // 5 positions
    'get /api/items/widget/v1/prop',
    'get /api/items/:item/:idk/propA',
    // 4 positions
    'get /api/items/widget/v1',
    'get /api/items/:item/propA',
    'get /api/items/:item/propB',
    'get /api/:item/items/propB',
    'get /api/items/item/:item',
    // 3 positions
    'get /api/items/*',
    // 2 positions
    'get /api/items',
    'get /api/stuff',
    'get /idk/foo',
    // 1 position
    'get /api',
    'get /',
    'get /*',
    'get /:idk',

    /* post */
    // 5 positions
    'post /api/items/widget/v1/prop',
    // 4 positions
    'post /api/items/:item/prop1',
    'post /api/items/:item/prop2',
    // 3 positions
    'post /api/items/:stuff',
    // 2 positions
    'post /api/items',
    // 1 position
    'post /api',
    'post /',
    'post /:idk',

    /* put */
    // 5 positions
    'put /api/items/widget/v1/prop',
    // 4 positions
    'put /api/items/:item/prop-a',
    'put /api/items/:item/prop-b',
    // 2 positions
    'put /api/*',
    // 1 position
    'put /api',
    'put /',
    'put /:idk',

    /* patch */
    // 5 positions
    'patch /api/items/widget/v1/prop',
    // 4 positions
    'patch /api/items/:item/prop_a',
    'patch /api/items/:item/prop_b',
    // 1 position
    'patch /api',
    'patch /',
    'patch /:idk',

    /* options */
    // 5 positions
    'options /api/items/widget/v1/prop',
    // 1 position
    'options /api',
    'options /',
    'options /:idk',

    /* head */
    // 5 positions
    'head /api/items/widget/v1/prop',
    // 1 position
    'head /api',
    'head /',
    'head /:idk',

    /* any */
    // 5 positions
    'any /api/items/widget/v1/prop',
    // 1 position
    'any /api',
    'any /',
    'any /*',
  ]
  let shuffled = [ ...desiredOrder ].sort(() => Math.random() - 0.5)
  t.notDeepEqual(shuffled, desiredOrder, 'Routes were indeed shuffled')

  let arc = parse(`@http\n${shuffled.join('\n')}`)
  let http = populateHTTP({ arc, inventory })
  let resultingOrder = http.map(({ name }) => name)
  t.deepEqual(resultingOrder, desiredOrder, 'Sorted correctly')
})

test('@http population: validation errors', t => {
  t.plan(22)
  // Test assumes complex format is outputting the same data as simple, so we're only testing errors in the simple format
  let errors = []
  function run (str) {
    let arc = parse(`@http\n${str}`)
    populateHTTP({ arc, inventory, errors })
  }
  function check (str = 'Invalid path errored', qty = 1) {
    t.equal(errors.length, qty, str)
    console.log(errors.join('\n'))
    // Run a bunch of control tests at the top by resetting errors after asserting
    errors = []
  }

  // Controls
  run(`get /hi`)
  run(`get /hi-there`)
  run(`get /hi.there`)
  run(`get /hi_there`)
  run(`get /hi/:there`)
  run(`get /hi/:there/*`)
  run(`get /hi/:there.friend/*`)
  run(`get /hi/:there_friend/*`)
  run(`get /hi/:there-friend/*`)
  run(`get /hi/:there/foo.Bar.baz_f1z-buz/*`)
  t.equal(errors.length, 0, `Valid routes did not error`)

  // Errors
  run(`get /there\nget /there\nget /there`)
  check(`Duplicate routes errored`)

  run(`get /there
/there
  method get`)
  check(`Duplicate routes errored (simple + complex)`)

  run(`hi /there`)
  check(`Invalid method errored`)

  run(`get /hi-there!`)
  check()

  run(`get /hi^there!`)
  check()

  run(`get /hi there`)
  check(`Invalid weird array route errored`)

  run(`get hi-there`)
  check()

  run(`get /hi/there/`)
  check()

  run(`get //hi`)
  check()

  run(`get /hi//there`)
  check()

  run(`get /hi-/there`)
  check()

  run(`get /hi/there-`)
  check()

  run(`get /hi./there`)
  check()

  run(`get /hi/there.`)
  check()

  run(`get /hi_/there`)
  check()

  run(`get /hi/there_`)
  check()

  run(`get /hi/:/there`)
  check(`Invalid param errored`)

  run(`get /hi/param_things:/there`)
  check(`Invalid param errored`)

  run(`get /hi/param:things/there`)
  check(`Invalid param errored`)

  run(`get /hi/th*re`)
  check(`Invalid catchall errored`)

  run(`get /hi/there*`)
  check(`Invalid catchall errored`)
})

test('@plugin population: plugin errors', t => {
  t.plan(8)
  let errors = []
  function run (returning) {
    let inventory = inventoryDefaults()
    inventory.plugins = setterPluginSetup(() => returning)
    populateHTTP({ arc: {}, inventory, errors })
  }
  function check (str = 'Invalid setter return', qty = 1) {
    t.equal(errors.length, qty, str)
    console.log(errors.join('\n'))
    // Run a bunch of control tests at the top by resetting errors after asserting
    errors = []
  }

  // Control
  run({ method: 'get', path: '/hi', src: 'hi' })
  t.equal(errors.length, 0, `Valid routes did not error`)

  // Errors
  run()
  check()

  run({})
  check()

  run({ name: 'get /hi' })
  check()

  run({ method: 'get' })
  check()

  run({ path: 'hi' })
  check()

  run({ src: 'hi' })
  check()

  run([ { method: 'get', path: '/hi', src: 'hi' }, [] ])
  check()
})
