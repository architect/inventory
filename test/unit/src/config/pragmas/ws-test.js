let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'ws')
let populateWS = require(sut)

let cwd = process.cwd()
let inventory = inventoryDefaults()
inventory._project.src = cwd
let wsDir = join(cwd, 'src', 'ws')

test('Set up env', t => {
  t.plan(1)
  t.ok(populateWS, '@ws Lambda populator is present')
})

test('No @ws returns null', t => {
  t.plan(1)
  t.equal(populateWS({ arc: {}, inventory }), null, 'Returned null')
})

test('@ws population: simple format + defaults', t => {
  t.plan(10)
  let defaults = [ 'connect', 'default', 'disconnect' ]
  let arc = parse(`@ws`)
  let ws = populateWS({ arc, inventory })
  t.equal(ws.length, defaults.length, 'Got correct number of routes back')
  defaults.forEach(val => {
    t.ok(ws.some(route => route.name === val), `Got route: ${val}`)
  })
  ws.forEach(route => {
    let { name, handlerFile, src } = route
    t.equal(src, join(wsDir, name), `Route configured with correct source dir: ${src}`)
    t.ok(handlerFile.startsWith(src), `Handler file is in the correct source dir`)
  })
})

test('@ws population: simple format + defaults + additional action', t => {
  t.plan(16)
  let defaults = [ 'connect', 'default', 'disconnect' ]
  let values = [ 'some-action', 'some-other-action' ]
  let arc = parse(`
@ws
${defaults[0]} # enumerate a default for good measure / testing all code paths
${values.join('\n')}
`)
  let ws = populateWS({ arc, inventory })
  t.equal(ws.length, defaults.length + values.length, 'Got correct number of routes back')
  defaults.concat(values).forEach(val => {
    t.ok(ws.some(route => route.name === val), `Got route: ${val}`)
  })
  ws.forEach(route => {
    let { name, handlerFile, src } = route
    t.equal(src, join(wsDir, name), `Route configured with correct source dir: ${src}`)
    t.ok(handlerFile.startsWith(src), `Handler file is in the correct source dir`)
  })
})

test('@ws population: complex format + defaults + additional action', t => {
  t.plan(16)
  let defaults = [ 'connect', 'default', 'disconnect' ]
  let values = [ 'some-action', 'some-other-action' ]
  let complexValues = [
    `${defaults[0]}
  src ${defaults[0]}/path`,
    `${defaults[1]}
  src ${defaults[1]}/path`,
    `${defaults[2]}
  src ${defaults[2]}/path`,
    `${values[0]}
  src ${values[0]}/path`,
    `${values[1]}
  src ${values[1]}/path`,
  ]
  let arc = parse(`
@ws
${complexValues.join('\n')}
`)
  let ws = populateWS({ arc, inventory })
  t.equal(ws.length, defaults.length + values.length, 'Got correct number of routes back')
  defaults.concat(values).forEach(val => {
    t.ok(ws.some(route => route.name === val), `Got route: ${val}`)
  })
  ws.forEach(route => {
    let { name, handlerFile, src } = route
    t.equal(src, join(cwd, `${name}/path`), `Route configured with correct source dir: ${src}`)
    t.ok(handlerFile.startsWith(src), `Handler file is in the correct source dir`)
  })
})

test(`@ws population: deprecated mode (prepends 'ws-')`, t => {
  t.plan(14)
  process.env.DEPRECATED = true
  let defaults = [ 'connect', 'default', 'disconnect' ]
  let arc = parse(`
@ws
${defaults.join('\n')}
`)
  let ws = populateWS({ arc, inventory })
  t.equal(ws.length, defaults.length, 'Got correct number of routes back')
  defaults.forEach(val => {
    t.ok(ws.some(route => route.name === val), `Got route.name: ${val}`)
    t.ok(ws.some(route => route.route === val), `Got route.route: ${val}`)
  })
  ws.forEach(route => {
    let { name, handlerFile, src } = route
    t.equal(src, join(wsDir, 'ws-' + name), `Route configured with correct source dir: ${src}`)
    t.ok(handlerFile.startsWith(src), `Handler file is in the correct source dir`)
  })
  delete process.env.DEPRECATED
  t.notOk(process.env.DEPRECATED, 'Cleaned up deprecated status')
})

test('@ws population: invalid paths throw', t => {
  t.plan(3)
  let arc

  arc = parse(`
@ws
hi there
`)
  t.throws(() => {
    populateWS({ arc, inventory })
  }, 'Invalid route threw')

  arc = parse(`
@ws
  hi there
`)
  t.throws(() => {
    populateWS({ arc, inventory })
  }, 'Invalid simple route threw')

  arc = parse(`
@ws
why hello there
`)
  t.throws(() => {
    populateWS({ arc, inventory })
  }, 'Invalid complex route threw')
})
