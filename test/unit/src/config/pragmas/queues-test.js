let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'queues')
let populateQueues = require(sut)

let cwd = process.cwd()
let inventory = inventoryDefaults()
inventory._project.src = cwd
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
    t.ok(queues.some(queue => queue.name === val), `Got queue: ${val}`)
  })
  queues.forEach(queue => {
    let { handlerFile, name, src } = queue
    t.equal(src, join(queuesDir, name), `Queue configured with correct source dir: ${src}`)
    t.ok(handlerFile.startsWith(src), `Handler file is in the correct source dir`)
  })
})

test('@queues population: complex format', t => {
  t.plan(7)

  let complexValues = [
    `${values[0]}
  src ${values[0]}/path`,
    `${values[1]}
  src ${values[1]}/path`
  ]
  let arc = parse(`
@queues
${complexValues.join('\n')}
`)
  let queues = populateQueues({ arc, inventory })
  t.equal(queues.length, complexValues.length, 'Got correct number of queues back')
  values.forEach(val => {
    t.ok(queues.some(queue => queue.name === val), `Got queue: ${val}`)
  })
  queues.forEach(queue => {
    let { handlerFile, name, src } = queue
    t.equal(src, join(cwd, `${name}/path`), `Queue configured with correct source dir: ${name}/path`)
    t.ok(handlerFile.startsWith(join(cwd, `${name}/path`)), `Handler file is in the correct source dir`)
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
    t.ok(queues.some(queue => queue.name === val), `Got queue: ${val}`)
  })
  queues.forEach(queue => {
    let { handlerFile, name, src } = queue
    t.equal(src, join(queuesDir, name), `Complex queue entry fell back to correct default source dir: ${src}`)
    t.ok(handlerFile.startsWith(src), `Handler file is in the correct source dir`)
  })
})

test('@queues population: invalid queues throw', t => {
  t.plan(1)

  let arc = parse(`
@queues
hi there
`)
  t.throws(() => {
    populateQueues({ arc, inventory })
  }, 'Invalid queue threw')
})
