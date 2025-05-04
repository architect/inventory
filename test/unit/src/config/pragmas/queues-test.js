let { join } = require('node:path')
let parse = require('@architect/parser')
let { test } = require('node:test')
let cwd = process.cwd()
let inventoryDefaults = require('../../../../../src/defaults')
let populateQueues = require('../../../../../src/config/pragmas/queues')

let inventory = inventoryDefaults()
let queuesDir = join(cwd, 'src', 'queues')
let values = [ 'foo', 'bar' ]

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(populateQueues, '@queues Lambda populator is present')
})

test('No @queues returns null', t => {
  t.plan(1)
  t.assert.equal(populateQueues({ arc: {}, inventory }), null, 'Returned null')
})

test('@queues: fifo defaults', t => {
  t.plan(2)
  let arc
  let queues

  arc = parse(`
@queues
${values[0]}
`)
  queues = populateQueues({ arc, inventory })
  queues.forEach(queue => {
    let { config } = queue
    t.assert.equal(config.fifo, true, `Queue fifo is true by default`)
  })

  // A bit jank, but `@aws config fifo` is populated in a diff code path
  // Thus, we have to manually mock it here to test the project-level function config for fifo
  let inv = inventoryDefaults()
  inv._project.cwd = cwd
  inv._project.defaultFunctionConfig.fifo = false

  arc = parse(`
@aws
fifo false
@queues
${values[0]}
`)
  queues = populateQueues({ arc, inventory: inv })
  queues.forEach(queue => {
    let { config } = queue
    t.assert.equal(config.fifo, false, `Queue fifo is set to false via @aws fifo false`)
  })
})

test('@queues population: simple format', t => {
  t.plan(7)

  let arc = parse(`
@queues
${values.join('\n')}
`)
  let queues = populateQueues({ arc, inventory })
  t.assert.equal(queues.length, values.length, 'Got correct number of queues back')
  values.forEach(val => {
    t.assert.ok(queues.some(queue => queue.name === val), `Got queue: ${val}`)
  })
  queues.forEach(queue => {
    let { handlerFile, name, src } = queue
    t.assert.equal(src, join(queuesDir, name), `Queue configured with correct source dir: ${src}`)
    t.assert.ok(handlerFile.startsWith(src), `Handler file is in the correct source dir`)
  })
})

test('@queues population: complex format', t => {
  t.plan(7)

  let complexValues = [
    `${values[0]}
  src ${values[0]}/path`,
    `${values[1]}
  src ${values[1]}/path`,
  ]
  let arc = parse(`
@queues
${complexValues.join('\n')}
`)
  let queues = populateQueues({ arc, inventory })
  t.assert.equal(queues.length, complexValues.length, 'Got correct number of queues back')
  values.forEach(val => {
    t.assert.ok(queues.some(queue => queue.name === val), `Got queue: ${val}`)
  })
  queues.forEach(queue => {
    let { handlerFile, name, src } = queue
    t.assert.equal(src, join(cwd, `${name}/path`), `Queue configured with correct source dir: ${name}/path`)
    t.assert.ok(handlerFile.startsWith(join(cwd, `${name}/path`)), `Handler file is in the correct source dir`)
  })
})

test('@queues population: complex format + fallback to default paths', t => {
  t.plan(7)

  let complexValues = [
    `${values[0]}
  whatever thingo`,
    `${values[1]}
  whatever thingo`,
  ]
  let arc = parse(`
@queues
${complexValues.join('\n')}
`)
  let queues = populateQueues({ arc, inventory })
  t.assert.equal(queues.length, complexValues.length, 'Got correct number of queues back')
  values.forEach(val => {
    t.assert.ok(queues.some(queue => queue.name === val), `Got queue: ${val}`)
  })
  queues.forEach(queue => {
    let { handlerFile, name, src } = queue
    t.assert.equal(src, join(queuesDir, name), `Complex queue entry fell back to correct default source dir: ${src}`)
    t.assert.ok(handlerFile.startsWith(src), `Handler file is in the correct source dir`)
  })
})

test('@queues population: validation errors', t => {
  t.plan(13)
  // Test assumes complex format is outputting the same data as simple, so we're only testing errors in the simple format
  let errors = []
  function run (str) {
    let arc = parse(`@queues\n${str}`)
    populateQueues({ arc, inventory, errors })
  }
  function check (str = 'Invalid queue errored') {
    t.assert.equal(errors.length, 1, str)
    console.log(errors[0])
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
  t.assert.equal(errors.length, 0, `Valid queues did not error`)

  // Errors
  run(`hi\nhi\nhi`)
  check(`Duplicate queues errored`)

  run(`hi
hi
  src foo`)
  check(`Duplicate queues errored (simple + complex)`)

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
