let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let cwd = process.cwd()
let inventoryDefaultsPath = join(cwd, 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let testLibPath = join(cwd, 'test', 'lib')
let testLib = require(testLibPath)
let sut = join(cwd, 'src', 'config', 'pragmas', 'ws')
let populateWS = require(sut)

let inventory = inventoryDefaults()
let defaults = [ 'connect', 'default', 'disconnect' ]
let wsDir = join(cwd, 'src', 'ws')
let setterPluginSetup = testLib.setterPluginSetup.bind({}, 'ws')

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

test('@ws population: plugin setter', t => {
  t.plan(16)

  let values = [ 'some-action', 'some-other-action' ]
  let inventory = inventoryDefaults()
  let setter = () => values.map(v => ({ name: v, src: join(wsDir, v) }))
  inventory.plugins = setterPluginSetup(setter)

  let ws = populateWS({ arc: {}, inventory })
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

test('@ws population: invalid paths errors', t => {
  t.plan(3)
  let arc
  let errors

  arc = parse(`
@ws
hi there
`)
  errors = []
  populateWS({ arc, inventory, errors })
  t.ok(errors.length, 'Invalid route errored')

  arc = parse(`
@ws
  hi there
`)
  errors = []
  populateWS({ arc, inventory, errors })
  t.ok(errors.length, 'Invalid simple route errored')

  arc = parse(`
@ws
why hello there
`)
  errors = []
  populateWS({ arc, inventory, errors })
  t.ok(errors.length, 'Invalid complex route errored')
})


test('@ws population: validation errors', t => {
  t.plan(7)
  // Test assumes complex format is outputting the same data as simple, so we're only testing errors in the simple format
  let errors = []
  function run (str) {
    let arc = parse(`@ws\n${str}`)
    populateWS({ arc, inventory, errors })
  }
  function check (str = 'Invalid WebSocket errored', qty = 1) {
    t.equal(errors.length, qty, str)
    console.log(errors.join('\n'))
    // Run a bunch of control tests at the top by resetting errors after asserting
    errors = []
  }

  // Controls
  run(`hi`)
  run(`hi-there`)
  run(`hithere\nhiThere`) // Case-sensitive!
  run(`hiThere`)
  run(`hi.there`)
  run(`h1_there`)
  run(`_hi`)
  run(`.hi`)
  run(`-hi`)
  run(`hi_`)
  run(`hi.`)
  run(`hi-`)
  t.equal(errors.length, 0, `Valid WebSocket did not error`)

  // Errors
  run(`hi\nhi\nhi`)
  check(`Duplicate WebSocket errored`)

  run(`$default\ndefault`)
  check(`Similarly duplicate (default) WebSockets errored`)

  run(`hi
hi
  src foo`)
  check(`Duplicate WebSocket errored (simple + complex)`)

  run(`hi there`)
  check()

  run(`hi-there!`)
  check()

  let name = Array.from(Array(130), () => 'hi').join('')
  run(name)
  check()
})


test('@ws population: plugin errors', t => {
  t.plan(5)
  let errors = []
  function run (returning) {
    let inventory = inventoryDefaults()
    inventory.plugins = setterPluginSetup(() => returning)
    populateWS({ arc: {}, inventory, errors })
  }
  function check (str = 'Invalid setter return', qty = 1) {
    t.equal(errors.length, qty, str)
    console.log(errors.join('\n'))
    // Run a bunch of control tests at the top by resetting errors after asserting
    errors = []
  }

  // Control
  run({ name: 'hi', src: 'hi' })
  t.equal(errors.length, 0, `Valid routes did not error`)

  // Errors
  run()
  check()

  run({})
  check()

  run({ name: 'hi' })
  check()

  run({ src: 'hi' })
  check()
})
