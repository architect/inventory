let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'queues')
let populateQueues = require(sut)

let cwd = process.cwd()
let inventory = inventoryDefaults()
inventory.project.dir = cwd
let queuesDir = join(cwd, 'src', 'queues')
let values = [ 'foo', 'bar' ]

test('Set up env', t => {
  t.plan(1)
  t.ok(populateQueues, '@queues Lambda populator is present')
})

test('No @queues returns null', t => {
  t.plan(1)
  t.equal(populateQueues({ arc: {}, inventory }), null, 'Returned null')
})

test('@queues population: simple format', t => {
  t.plan(7)

  let arc = parse(`
@queues
${values.join('\n')}
`)
  let queues = populateQueues({ arc, inventory })
  t.equal(queues.length, values.length, 'Got correct number of queues back')
  values.forEach(val => {
    t.ok(queues.some(event => event.name === val), `Got event: ${val}`)
  })
  queues.forEach(event => {
    t.equal(event.srcDir, join(queuesDir, event.name), `Event configured with correct source dir: ${event.srcDir}`)
    t.ok(event.handlerFile.startsWith(event.srcDir), `Handler file is in the correct source dir`)
  })
})

test('@queues population: complex format', t => {
  t.plan(7)

  let complexValues = [
    `${values[0]}
  path ${values[0]}/path`,
    `${values[1]}
  path ${values[1]}/path`
  ]
  let arc = parse(`
@queues
${complexValues.join('\n')}
`)
  let queues = populateQueues({ arc, inventory })
  t.equal(queues.length, complexValues.length, 'Got correct number of queues back')
  values.forEach(val => {
    t.ok(queues.some(event => event.name === val), `Got event: ${val}`)
  })
  queues.forEach(event => {
    t.equal(event.srcDir, join(cwd, `${event.name}/path`), `Event configured with correct source dir: ${event.name}/path`)
    t.ok(event.handlerFile.startsWith(join(cwd, `${event.name}/path`)), `Handler file is in the correct source dir`)
  })
})

test('@queues population: complex format + fallback to default paths', t => {
  t.plan(7)

  let complexValues = [
    `${values[0]}
  whatever thingo`,
    `${values[1]}
  whatever thingo`
  ]
  let arc = parse(`
@queues
${complexValues.join('\n')}
`)
  let queues = populateQueues({ arc, inventory })
  t.equal(queues.length, complexValues.length, 'Got correct number of queues back')
  values.forEach(val => {
    t.ok(queues.some(event => event.name === val), `Got event: ${val}`)
  })
  queues.forEach(event => {
    t.equal(event.srcDir, join(queuesDir, event.name), `Complex event entry fell back to correct default source dir: ${event.srcDir}`)
    t.ok(event.handlerFile.startsWith(event.srcDir), `Handler file is in the correct source dir`)
  })
})

test('@queues population: invalid events throw', t => {
  t.plan(1)

  let arc = parse(`
@queues
hi there
`)
  t.throws(() => {
    populateQueues({ arc, inventory })
  }, 'Invalid event threw')
})
