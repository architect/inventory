let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'aws')
let populateAWS = require(sut)

let inventory = inventoryDefaults()

test('Set up env', t => {
  t.plan(1)
  t.ok(populateAWS, 'Event Lambda populator is present')
})

test('No @aws returns null', t => {
  t.plan(1)
  t.equal(populateAWS({ arc: {}, inventory }), null, 'Returned null')
})

test('Test @aws population', t => {
  t.plan(4)
  let value = 10
  let arc
  let aws

  arc = parse(`
@aws
timeout ${value}
`)
  aws = populateAWS({ arc, inventory })
  t.notEqual(inventory.aws.timeout, value, 'Testing value is not already the default')
  t.equal(inventory.aws.region, 'us-west-2', 'Region defaults to us-west-2')
  t.equal(aws.timeout, value, 'Properly upserted timeout')

  let region = process.env.AWS_REGION
  let east1 = 'us-east-1'
  process.env.AWS_REGION = east1
  aws = populateAWS({ arc, inventory })
  t.equal(aws.region, east1, `Region defaults to ${east1}`)

  if (region) process.env.AWS_REGION = region
  else delete process.env.AWS_REGION
})
