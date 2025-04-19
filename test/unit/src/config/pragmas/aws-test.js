let { join } = require('node:path')
let parse = require('@architect/parser')
let { test } = require('node:test')
let inventoryDefaults = require('../../../../../src/defaults')
let populateAWS = require('../../../../../src/config/pragmas/aws')

let inventory = inventoryDefaults()
let str = s => JSON.stringify(s)

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(populateAWS, '@aws populator is present')
})

test('No @aws returns default @aws', t => {
  t.plan(1)
  t.assert.equal(str(populateAWS({ arc: {}, inventory })), str(inventory.aws), 'Returned default @aws')
})

test('Test @aws population', t => {
  t.plan(6)
  let apiType = 'rest'
  let value = 10
  let arc
  let aws

  arc = parse(`
@aws
apigateway ${apiType}
timeout ${value}
`)
  aws = populateAWS({ arc, inventory })
  t.assert.notEqual(inventory.aws.apigateway, apiType, 'Testing value is not already the default')
  t.assert.notEqual(inventory.aws.timeout, value, 'Testing value is not already the default')
  t.assert.equal(inventory.aws.region, 'us-west-2', 'Region defaults to us-west-2')
  t.assert.equal(aws.apigateway, apiType, 'Properly upserted apigateway')
  t.assert.equal(aws.timeout, value, 'Properly upserted timeout')

  let region = process.env.AWS_REGION
  let east1 = 'us-east-1'
  process.env.AWS_REGION = east1
  inventory = inventoryDefaults()
  aws = populateAWS({ arc, inventory })
  t.assert.equal(aws.region, east1, `Region defaults to ${east1}`)

  if (region) process.env.AWS_REGION = region
  else delete process.env.AWS_REGION
})

test('@aws: invalid settings errors', t => {
  t.plan(1)
  let arc
  let errors = []
  arc = parse(`
@aws
apigateway idk
`)
  populateAWS({ arc, inventory, errors })
  t.assert.ok(errors.length, 'Invalid API Gateway setting errored')
})
