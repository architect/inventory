let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'events')
let populateEvents = require(sut)

let cwd = process.cwd()
let inventory = inventoryDefaults()
inventory._project.src = cwd
let eventsDir = join(cwd, 'src', 'events')
let values = [ 'foo', 'bar' ]

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
