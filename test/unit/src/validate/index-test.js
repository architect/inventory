let { join } = require('path')
let test = require('tape')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'validate')
let finalValidation = require(sut)

let defaults = inventoryDefaults()
let params = { cwd: '/foo' }
let reset = () => defaults = inventoryDefaults()

test('Set up env', t => {
  t.plan(1)
  t.ok(finalValidation, 'Final validator is present')
})

test('All good', t => {
  t.plan(1)
  let err = finalValidation(params, defaults)
  if (err) t.fail(err)
  else t.pass('Did nothing')

  t.teardown(reset)
})

test('Runtime errors', t => {
  t.plan(5)
  let err

  defaults.aws.runtime = 'fail'
  err = finalValidation(params, defaults)
  if (!err) t.fail('Expected an error')
  else {
    t.ok(err.message.includes('Configuration error'), `Got a configuration error`)
    console.log(err.message)
  }
  reset()

  defaults.aws.runtime = 'fail'
  let name = 'an-event'
  defaults.events = [ {
    name,
    config: {
      runtime: 'fail'
    }
  } ]
  err = finalValidation(params, defaults)
  if (!err) t.fail('Expected an error')
  else {
    t.ok(err.message.includes('Configuration error'), `Got a configuration error`)
    t.ok(!err.message.includes(name), `Configuration error is not Lambda-specific`)
    console.log(err.message)
  }
  reset()

  defaults.events = [ {
    name,
    config: {
      runtime: 'fail'
    }
  } ]
  err = finalValidation(params, defaults)
  if (!err) t.fail('Expected an error')
  else {
    t.ok(err.message.includes('Configuration error'), `Got a configuration error`)
    t.ok(err.message.includes(`@events ${name}`), `Configuration error is Lambda-specific`)
    console.log(err.message)
  }

  t.teardown(reset)
})

test('Configuration errors', t => {
  t.plan(1)
  defaults.aws.layers = [ true ]
  let err = finalValidation(params, defaults)
  if (!err) t.fail('Expected an error')
  else {
    t.ok(err.message.includes('Configuration error'), `Got a configuration error`)
    console.log(err.message)
  }

  t.teardown(reset)
})

test('Validation errors', t => {
  t.plan(1)
  let tables = [ { name: 'table' } ]
  let streams = [ { name: 'foo', table: 'foo', config: { runtime: 'nodejs14.x' } } ]
  let inventory = { ...defaults, tables, streams }
  let err = finalValidation(params, inventory)
  if (!err) t.fail('Expected an error')
  else {
    t.ok(err.message.includes('Validation error'), `Got a validation error`)
    console.log(err.message)
  }

  t.teardown(reset)
})
