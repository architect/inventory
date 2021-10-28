let { join } = require('path')
let test = require('tape')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'validate')
let finalValidation = require(sut)

let defaults = inventoryDefaults()
let params = { cwd: '/foo' }
let reset = () => defaults = inventoryDefaults()
let config = { memory: 1000, timeout: 30 }

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

test('Configuration errors', t => {
  t.plan(4)
  defaults.aws.layers = [ true ]
  let err = finalValidation(params, defaults)
  if (!err) t.fail('Expected an error')
  else {
    t.ok(err.message.includes('Configuration error'), `Got a configuration error`)
    console.log(err.message)
  }

  defaults.aws.memory = 0
  err = finalValidation(params, defaults)
  if (!err) t.fail('Expected an error')
  else {
    t.ok(err.message.includes('Configuration error'), `Got a configuration error`)
    console.log(err.message)
  }

  defaults.aws.runtime = 'fail'
  err = finalValidation(params, defaults)
  if (!err) t.fail('Expected an error')
  else {
    t.ok(err.message.includes('Configuration error'), `Got a configuration error`)
    console.log(err.message)
  }

  defaults.aws.timeout = 0
  err = finalValidation(params, defaults)
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
  let streams = [ { name: 'foo', table: 'foo', config: { runtime: 'nodejs14.x', ...config } } ]
  let inventory = { ...defaults, tables, streams }
  let err = finalValidation(params, inventory)
  if (!err) t.fail('Expected an error')
  else {
    t.ok(err.message.includes('Validation error'), `Got a validation error`)
    console.log(err.message)
  }

  t.teardown(reset)
})
