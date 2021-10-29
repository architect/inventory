let { join } = require('path')
let test = require('tape')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'validate', 'config')
let validateConfig = require(sut)

let errors = []
let defaults = inventoryDefaults()
let params = { cwd: '/foo' }
let reset = () => {
  if (errors[0]) console.log(errors[0])
  defaults = inventoryDefaults()
  errors = []
}

let name = 'an-event'
let okRuntime = 'nodejs14.x'
let okMemory = 1000
let okTimeout = 30
function createPragma (memory, runtime, timeout) {
  return [ {
    name,
    config: { memory, runtime, timeout }
  } ]
}

test('Set up env', t => {
  t.plan(1)
  t.ok(validateConfig, 'Config validator is present')
})

test('Do nothing', t => {
  t.plan(1)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 0, `No errors reported`)

  t.teardown(reset)
})

test('Valid config', t => {
  t.plan(2)
  defaults.aws.runtime = okRuntime
  defaults.aws.memory = okMemory
  defaults.aws.timeout = okTimeout
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 0, `No errors reported (global config)`)
  reset()

  defaults.events = createPragma(okMemory, okRuntime, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 0, `No errors reported (function config)`)

  t.teardown(reset)
})

/**
 * Memory
 */
test('Minimum memory not met', t => {
  t.plan(6)

  defaults.aws.memory = 127
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global config)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)
  reset()

  defaults.events = createPragma(127, okRuntime, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (function config)`)
  t.ok(errors[0].includes(name), `Configuration error is Lambda-specific`)
  reset()

  defaults.aws.memory = 127
  defaults.events = createPragma(127, okRuntime, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global + function config match)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)

  t.teardown(reset)
})

test('Maximum memory exceeded', t => {
  t.plan(6)

  defaults.aws.memory = 10241
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global config)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)
  reset()

  defaults.events = createPragma(10241, okRuntime, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (function config)`)
  t.ok(errors[0].includes(name), `Configuration error is Lambda-specific`)
  reset()

  defaults.aws.memory = 10241
  defaults.events = createPragma(10241, okRuntime, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global + function config match)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)

  t.teardown(reset)
})

test('Memory is invalid', t => {
  t.plan(6)

  defaults.aws.memory = 1.01
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global config)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)
  reset()

  defaults.events = createPragma(1.01, okRuntime, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (function config)`)
  t.ok(errors[0].includes(name), `Configuration error is Lambda-specific`)
  reset()

  defaults.aws.memory = 1.01
  defaults.events = createPragma(1.01, okRuntime, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global + function config match)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)

  t.teardown(reset)
})

/**
 * Runtime
 */
test('Runtime is invalid', t => {
  t.plan(6)
  let runtime = 'fail'

  defaults.aws.runtime = runtime
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global config)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)
  reset()

  defaults.events = createPragma(okMemory, runtime, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (function config)`)
  t.ok(errors[0].includes(name), `Configuration error is Lambda-specific`)
  reset()

  defaults.aws.runtime = runtime
  defaults.events = createPragma(okMemory, runtime, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global + function config match)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)

  t.teardown(reset)
})

/**
 * Timeout
 */
test('Minimum timeout not met', t => {
  t.plan(6)

  defaults.aws.timeout = 0
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global config)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)
  reset()

  defaults.events = createPragma(okMemory, okRuntime, 0)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (function config)`)
  t.ok(errors[0].includes(name), `Configuration error is Lambda-specific`)
  reset()

  defaults.aws.timeout = 0
  defaults.events = createPragma(okMemory, okRuntime, 0)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global + function config match)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)

  t.teardown(reset)
})

test('Maximum timeout exceeded', t => {
  t.plan(6)
  let timeout = 1 * 60 * 15 + 1

  defaults.aws.timeout = timeout
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global config)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)
  reset()

  defaults.events = createPragma(okMemory, okRuntime, timeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (function config)`)
  t.ok(errors[0].includes(name), `Configuration error is Lambda-specific`)
  reset()

  defaults.aws.timeout = timeout
  defaults.events = createPragma(okMemory, okRuntime, timeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global + function config match)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)

  t.teardown(reset)
})

test('Timeout is invalid', t => {
  t.plan(6)

  defaults.aws.timeout = 1.01
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global config)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)
  reset()

  defaults.events = createPragma(okMemory, okRuntime, 1.01)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (function config)`)
  t.ok(errors[0].includes(name), `Configuration error is Lambda-specific`)
  reset()

  defaults.aws.timeout = 1.01
  defaults.events = createPragma(okMemory, okRuntime, 1.01)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global + function config match)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)

  t.teardown(reset)
})
