let { test } = require('node:test')
let inventoryDefaults = require('../../../../src/defaults')
let finalValidation = require('../../../../src/validate')

let defaults = inventoryDefaults()
let params = { cwd: '/foo' }
let reset = () => defaults = inventoryDefaults()
let config = { memory: 1000, timeout: 30 }

// Apply reset before each test
test.beforeEach(reset)

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(finalValidation, 'Final validator is present')
})

test('All good', t => {
  t.plan(1)
  let err = finalValidation(params, defaults)
  if (err) t.assert.fail(err)
  else t.assert.ok(true, 'Did nothing')
})

test('Configuration errors', t => {
  t.plan(6)
  defaults.aws.layers = [ true ]
  let err = finalValidation(params, defaults)
  if (!err) t.assert.fail('Expected an error')
  else {
    t.assert.match(err.message, /Configuration error/, `Got a configuration error`)
    t.diagnostic(err.message)
  }

  defaults.aws.memory = 0
  err = finalValidation(params, defaults)
  if (!err) t.assert.fail('Expected an error')
  else {
    t.assert.match(err.message, /Configuration error/, `Got a configuration error`)
    t.diagnostic(err.message)
  }

  defaults.aws.runtime = 'fail'
  err = finalValidation(params, defaults)
  if (!err) t.assert.fail('Expected an error')
  else {
    t.assert.match(err.message, /Configuration error/, `Got a configuration error`)
    t.diagnostic(err.message)
  }

  defaults.aws.runtime = true
  err = finalValidation(params, defaults)
  if (!err) t.assert.fail('Expected an error')
  else {
    t.assert.match(err.message, /Configuration error/, `Got a configuration error`)
    t.diagnostic(err.message)
  }

  defaults.aws.runtime = 0
  err = finalValidation(params, defaults)
  if (!err) t.assert.fail('Expected an error')
  else {
    t.assert.match(err.message, /Configuration error/, `Got a configuration error`)
    t.diagnostic(err.message)
  }

  defaults.aws.timeout = 0
  err = finalValidation(params, defaults)
  if (!err) t.assert.fail('Expected an error')
  else {
    t.assert.match(err.message, /Configuration error/, `Got a configuration error`)
    t.diagnostic(err.message)
  }
})

test('Table validation errors', t => {
  t.plan(1)
  let tables = [ { name: 'table' } ]
  let streams = [ { name: 'foo', table: 'foo', config: { runtime: 'nodejs20.x', ...config } } ]
  let inventory = { ...defaults, tables, 'tables-streams': streams }
  let err = finalValidation(params, inventory)
  if (!err) t.assert.fail('Expected an error')
  else {
    t.assert.match(err.message, /Validation error/, `Got a validation error`)
    t.diagnostic(err.message)
  }
})

test('File path validation errors', t => {
  t.plan(1)
  defaults._project.cwd = '/füü'
  let err = finalValidation(params, defaults)
  if (!err) t.assert.fail('Expected an error')
  else {
    t.assert.match(err.message, /Project file path/, `Got a validation error`)
    t.diagnostic(err.message)
  }
})
