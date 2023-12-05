let { join } = require('path')
let mockTmp = require('mock-tmp')
let parse = require('@architect/parser')
let test = require('tape')
let cwd = process.cwd()
let populateHTTPPath = join(cwd, 'src', 'config', 'pragmas', 'http')
let populateHTTP = require(populateHTTPPath)
let inventoryDefaultsPath = join(cwd, 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let testLibPath = join(cwd, 'test', 'lib')
let testLib = require(testLibPath)
let sut = join(cwd, 'src', 'config', 'pragmas', 'views')
let populateViews = require(sut)

let setterPluginSetup = testLib.setterPluginSetup.bind({}, 'views')

test('Set up env', t => {
  t.plan(1)
  t.ok(populateViews, '@views populator is present')
})

test('No @http returns null @views', t => {
  t.plan(1)
  let inventory = inventoryDefaults()
  t.equal(populateViews({ arc: {}, inventory }), null, 'Returned null')
})

test('@views is null if src/views not present', t => {
  t.plan(1)
  let arc
  let pragmas
  arc = parse(`@http`)
  let inventory = inventoryDefaults()
  pragmas = { http: populateHTTP({ arc, inventory }) }
  let views = populateViews({ arc, pragmas, inventory })
  t.equal(views, null, 'Returned null')
})

test('Default dir is src/views (if present)', t => {
  t.plan(2)
  let cwd = mockTmp({ 'src/views': {} })
  let inventory = inventoryDefaults({ cwd })
  let arc
  let pragmas
  arc = parse(`@http`)
  pragmas = { http: populateHTTP({ arc, inventory }) }

  let views = populateViews({ arc, pragmas, inventory })
  t.equal(views.src, join(cwd, 'src', 'views'), 'Returned correct default dir')
  t.deepEqual(views.views, [], 'Returned empty views array')
  mockTmp.reset()
})

test('Arc Static Asset Proxy is not included in @views', t => {
  t.plan(3)
  let cwd = mockTmp({ 'src/views': {} })
  let inventory = inventoryDefaults({ cwd })
  let arc
  let pragmas
  arc = parse(`@http`)
  pragmas = { http: populateHTTP({ arc, inventory }) }

  arc = parse(`@http
get /foo
@views
get /*`)
  pragmas = { http: populateHTTP({ arc, inventory }) }

  let views = populateViews({ arc, pragmas, inventory })
  t.deepEqual(views.views, [], 'Returned empty views array')
  let asap = pragmas.http.find(r => r.name === 'get /*')
  t.ok(asap.arcStaticAssetProxy, 'Got back ASAP')
  t.notOk(asap.config.views, `Views setting not enabled in ASAP`)
  mockTmp.reset()
})

test(`@views population: defaults only to 'get' + 'any' routes (without @views)`, t => {
  t.plan(6)
  let cwd = mockTmp({ 'src/views': {} })
  let inventory = inventoryDefaults({ cwd })
  let arc
  let pragmas
  let values = [ 'get /', 'any /whatever', 'post /' ]
  arc = parse(`@http\n${values.join('\n')}`)
  pragmas = { http: populateHTTP({ arc, inventory }) }

  let views = populateViews({ arc, pragmas, inventory })
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
  mockTmp.reset()
})

test(`@views population: defaults only to 'get' + 'any' routes (with empty @views)`, t => {
  t.plan(6)
  let cwd = mockTmp({ 'src/views': {} })
  let inventory = inventoryDefaults({ cwd })
  let arc
  let pragmas
  let values = [ 'get /', 'any /whatever', 'post /' ]
  arc = parse(`@http\n${values.join('\n')}\n@views`)
  pragmas = { http: populateHTTP({ arc, inventory }) }

  let views = populateViews({ arc, pragmas, inventory })
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
  mockTmp.reset()
})

test(`@views population: defaults only to 'get' + 'any' routes (with src setting)`, t => {
  t.plan(7)
  let cwd = mockTmp({ 'foo/bar': {} })
  let inventory = inventoryDefaults({ cwd })
  let arc
  let pragmas
  let values = [ 'get /', 'any /whatever', 'post /' ]
  arc = parse(`@http
${values.join('\n')}
@views
src foo/bar`)
  pragmas = { http: populateHTTP({ arc, inventory }) }

  let views = populateViews({ arc, pragmas, inventory })
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
  mockTmp.reset()
})

test(`@views population: plugin setter defaults only to 'get' + 'any' routes (with src setting)`, t => {
  t.plan(22)
  let setter = () => ({ src: 'foo/bar' })

  let arc
  let cwd
  let inventory
  let pragmas
  let fn1
  let views
  let values = [ 'get /', 'any /whatever', 'post /' ]
  let httpLambda = values[0]

  // Basic plugin stuff
  cwd = mockTmp({ 'foo/bar': {} })
  inventory = inventoryDefaults({ cwd })
  inventory.plugins = setterPluginSetup(setter)

  arc = parse(`@http\n${values.join('\n')}`)
  pragmas = { http: populateHTTP({ arc, inventory }) }

  views = populateViews({ arc, pragmas, inventory })
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
  mockTmp.reset()

  // Fall back to src/views if specified dir is not found
  cwd = mockTmp({ 'src/views': {} })
  inventory = inventoryDefaults({ cwd })
  inventory.plugins = setterPluginSetup(setter)
  arc = parse(`@http\n${httpLambda}`)
  pragmas = { http: populateHTTP({ arc, inventory }) }
  views = populateViews({ arc, pragmas, inventory })
  t.ok(views.src.endsWith(join('src', 'views')), 'Got correct src dir back')
  t.equal(views.views.length, 1, 'Got correct number of routes with views back')
  mockTmp.reset()

  // Shared is null if setter doesn't set `required` flag and no dirs are found
  cwd = mockTmp({ 'foo/bar': {} })
  inventory = inventoryDefaults({ cwd })
  inventory.plugins = setterPluginSetup(setter)
  arc = parse(`@http\n${httpLambda}`)
  pragmas = { http: populateHTTP({ arc, inventory }) }
  // Just a control test!
  views = populateViews({ arc, pragmas, inventory })
  t.equal(views.src, 'foo/bar', 'Got correct src dir back')
  mockTmp.reset()
  views = populateViews({ arc, pragmas, inventory })
  t.equal(views, null, 'views is null')

  // Arc file wins
  cwd = mockTmp({ 'foo/bar': {} })
  inventory = inventoryDefaults({ cwd })
  setter = () => ({ src: 'foo/baz' })
  inventory.plugins = setterPluginSetup(setter)
  arc = parse(`@http
${values.join('\n')}
@views
src foo/bar`)
  pragmas = { http: populateHTTP({ arc, inventory }) }
  views = populateViews({ arc, pragmas, inventory })
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
  mockTmp.reset()

  // cwd isn't concatenated when an absolute file path is returned
  cwd = mockTmp({ 'foo/bar': {} })
  inventory = inventoryDefaults({ cwd })
  let src = join(inventory._project.cwd, 'foo', 'bar')
  setter = () => ({ src })
  inventory.plugins = setterPluginSetup(setter)
  arc = parse(`@http\n${httpLambda}`)
  pragmas = { http: populateHTTP({ arc, inventory }) }
  views = populateViews({ arc, pragmas, inventory })
  t.equal(views.src, src, 'Got correct src dir back')
  t.equal(views.views.length, 1, 'Got correct number of lambdae with views back')
  fn1 = pragmas.http.find(r => r.name === httpLambda)
  t.ok(views.views.includes(fn1.src), `Got shared lambda: ${httpLambda}`)
  t.ok(fn1.config.shared, `Shared setting enabled in lambda: ${httpLambda}`)
  mockTmp.reset()
})

test(`@views population: routes not explicitly defined have views disabled (with src setting)`, t => {
  t.plan(6)
  let cwd = mockTmp({ 'foo/bar': {} })
  let inventory = inventoryDefaults({ cwd })
  let arc
  let pragmas
  let values = [ 'get /', 'any /whatever', 'post /' ]
  arc = parse(`@http
${values.join('\n')}
@views
post /
src foo/bar`)
  pragmas = { http: populateHTTP({ arc, inventory }) }

  let views = populateViews({ arc, pragmas, inventory })
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
  mockTmp.reset()
})

test('@views: validation errors', t => {
  t.plan(12)
  let arc
  let cwd
  let inventory
  let pragmas
  let errors
  let updatePragmas = () => {
    pragmas = { http: populateHTTP({ arc, inventory }) }
  }

  cwd = mockTmp({ 'src/views': {} })
  inventory = inventoryDefaults({ cwd })
  arc = parse(`@http
get /foo
@views
put /bar`)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@views route not found in @http errored')
  mockTmp.reset()

  cwd = mockTmp({ 'src/views': {} })
  inventory = inventoryDefaults({ cwd })
  arc = parse(`@http
get /foo
@views
hi`)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@views invalid entry errored')
  mockTmp.reset()

  cwd = mockTmp({ 'src/views': {} })
  inventory = inventoryDefaults({ cwd })
  arc = parse(`@http
get /foo
@views
hey
  there`)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@views invalid entry errored')
  mockTmp.reset()

  arc = parse(`@http
get /foo
@views
src foo`)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@views src dir must exist')

  cwd = mockTmp({ foo: 'hi!' })
  inventory = inventoryDefaults({ cwd })
  arc = parse(`@http
get /foo
@views
src foo`)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@views src must refer to a dir, not a file')

  // From here on out we haven't needed to mock the filesystem since it should be returning errors prior to any folder existence checks; of course, update if that changes!
  errors = []
  populateViews({ arc: { views: [] }, inventory, errors })
  t.equal(errors.length, 1, '@views without @http errored')

  arc = parse(`@http
get /foo
@views
src src/index.js`)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@views src must be a directory')

  arc = parse(`@http
get /foo
@views
src .`)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@views src cannot be .')

  arc = parse(`@http
get /foo
@views
src ./`)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@views src cannot be ./')

  arc = parse(`@http
get /foo
@views
src ..`)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@views src cannot be ..')

  arc = parse(`@http
get /foo
@views
src ../`)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@views src cannot be ../')

  arc = parse(`@http
get /foo
@views
src true`)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@views src must be a string')
})

test('@views: plugin errors', t => {
  t.plan(9)
  let arc
  let cwd
  let inventory
  let pragmas
  let errors
  let setter
  let updatePragmas = () => {
    pragmas = { http: populateHTTP({ arc, inventory }) }
  }

  cwd = mockTmp({ foo: {}, hi: {} })
  inventory = inventoryDefaults({ cwd })
  arc = parse(`@http\nget /foo\n@views\nsrc foo`)
  setter = () => ({ src: 'hi', required: true })
  inventory.plugins = setterPluginSetup(setter)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors[0], '@views src setting conflicts with plugin', '@views src dir must exist if required flag is set')
  mockTmp.reset()

  arc = parse(`@http\nget /foo`)
  inventory.plugins = setterPluginSetup(setter)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors[0], 'Directory not found: hi', '@views src dir must exist if required flag is set')

  cwd = mockTmp({ foo: 'hi!' })
  inventory = inventoryDefaults({ cwd })
  setter = () => ({ src: 'foo' })
  inventory.plugins = setterPluginSetup(setter)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@views src must refer to a dir, not a file')
  mockTmp.reset()

  cwd = mockTmp({ 'src/index.js': '// hi!' })
  inventory = inventoryDefaults({ cwd })
  setter = () => ({ src: 'src/index.js' })
  inventory.plugins = setterPluginSetup(setter)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@views src must be a directory')

  // From here on out we haven't needed to mock the filesystem since it should be returning errors prior to any folder existence checks; of course, update if that changes!
  setter = () => ({ src: '.' })
  inventory.plugins = setterPluginSetup(setter)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@views src cannot be .')

  setter = () => ({ src: './' })
  inventory.plugins = setterPluginSetup(setter)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@views src cannot be ./')

  setter = () => ({ src: '..' })
  inventory.plugins = setterPluginSetup(setter)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@views src cannot be ..')

  setter = () => ({ src: '../' })
  inventory.plugins = setterPluginSetup(setter)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@views src cannot be ../')

  setter = () => ({ src: true })
  inventory.plugins = setterPluginSetup(setter)
  updatePragmas()
  errors = []
  populateViews({ arc, pragmas, inventory, errors })
  t.equal(errors.length, 1, '@views src must be a string')
})
