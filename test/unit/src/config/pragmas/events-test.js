let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let cwd = process.cwd()
let inventoryDefaultsPath = join(cwd, 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let testLibPath = join(cwd, 'test', 'lib')
let testLib = require(testLibPath)
let sut = join(cwd, 'src', 'config', 'pragmas', 'events')
let populateEvents = require(sut)

let inventory = inventoryDefaults()
let eventsDir = join(cwd, 'src', 'events')
let values = [ 'foo', 'bar' ]
let setterPluginSetup = testLib.setterPluginSetup.bind({}, 'events')

test('Set up env', t => {
  t.plan(1)
  t.ok(populateEvents, '@events Lambda populator is present')
})

test('No @events returns null', t => {
  t.plan(1)
  t.equal(populateEvents({ arc: {}, inventory }), null, 'Returned null')
})

test('@events population: simple format', t => {
  t.plan(7)

  let arc = parse(`
@events
${values.join('\n')}
`)
  let events = populateEvents({ arc, inventory })
  t.equal(events.length, values.length, 'Got correct number of events back')
  values.forEach(val => {
    t.ok(events.some(event => event.name === val), `Got event: ${val}`)
  })
  events.forEach(event => {
    let { handlerFile, name, src } = event
    t.equal(src, join(eventsDir, name), `Event configured with correct source dir: ${src}`)
    t.ok(handlerFile.startsWith(src), `Handler file is in the correct source dir`)
  })
})

test('@events population: complex format', t => {
  t.plan(7)

  let complexValues = [
    `${values[0]}
  src ${values[0]}/path`,
    `${values[1]}
  src ${values[1]}/path`
  ]
  let arc = parse(`
@events
${complexValues.join('\n')}
`)
  let events = populateEvents({ arc, inventory })
  t.equal(events.length, complexValues.length, 'Got correct number of events back')
  values.forEach(val => {
    t.ok(events.some(event => event.name === val), `Got event: ${val}`)
  })
  events.forEach(event => {
    let { handlerFile, name, src } = event
    t.equal(src, join(cwd, `${name}/path`), `Event configured with correct source dir: ${name}/path`)
    t.ok(handlerFile.startsWith(join(cwd, `${name}/path`)), `Handler file is in the correct source dir`)
  })
})

test('@events population: complex format + fallback to default paths', t => {
  t.plan(7)

  let complexValues = [
    `${values[0]}
  whatever thingo`,
    `${values[1]}
  whatever thingo`
  ]
  let arc = parse(`
@events
${complexValues.join('\n')}
`)
  let events = populateEvents({ arc, inventory })
  t.equal(events.length, complexValues.length, 'Got correct number of events back')
  values.forEach(val => {
    t.ok(events.some(event => event.name === val), `Got event: ${val}`)
  })
  events.forEach(event => {
    let { handlerFile, name, src } = event
    t.equal(src, join(eventsDir, name), `Complex event entry fell back to correct default source dir: $vent.src}`)
    t.ok(handlerFile.startsWith(src), `Handler file is in the correct source dir`)
  })
})

test('@events population: plugin setter', t => {
  t.plan(7)

  let inventory = inventoryDefaults()
  let setter = () => values.map(v => ({ name: v, src: join(eventsDir, v) }))
  inventory.plugins = setterPluginSetup(setter)

  let events = populateEvents({ arc: {}, inventory })
  t.equal(events.length, values.length, 'Got correct number of events back')
  values.forEach(val => {
    t.ok(events.some(event => event.name === val), `Got event: ${val}`)
  })
  events.forEach(event => {
    let { handlerFile, name, src } = event
    t.equal(src, join(eventsDir, name), `Event configured with correct source dir: ${src}`)
    t.ok(handlerFile.startsWith(src), `Handler file is in the correct source dir`)
  })
})

test('@events population: validation errors', t => {
  t.plan(13)
  // Test assumes complex format is outputting the same data as simple, so we're only testing errors in the simple format
  let errors = []
  function run (str) {
    let arc = parse(`@events\n${str}`)
    populateEvents({ arc, inventory, errors })
  }
  function check (str = 'Invalid event errored', qty = 1) {
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
  t.equal(errors.length, 0, `Valid events did not error`)

  // Errors
  run(`hi\nhi\nhi`)
  check(`Duplicate events errored`)

  run(`hi
hi
  src foo`)
  check(`Duplicate events errored (simple + complex)`)

  run(`hi there`)
  check()

  run(`hi-there!`)
  check()

  let name = Array.from(Array(125), () => 'hi').join('')
  run(name)
  check()

  run(`.hi-there`)
  check()

  run(`hi-there.`)
  check()

  run(`hi..there`)
  check()

  run(`aws.hi-there`)
  check()

  run(`AWS.hi-there`)
  check()

  run(`amazon.hi-there`)
  check()

  run(`Amazon.hi-there`)
  check()
})

test('@events population: plugin errors', t => {
  t.plan(5)
  let errors = []
  function run (returning) {
    let inventory = inventoryDefaults()
    inventory.plugins = setterPluginSetup(() => returning)
    populateEvents({ arc: {}, inventory, errors })
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
