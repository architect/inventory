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
let okRuntime = 'nodejs20.x'
let okMemory = 1000
let okTimeout = 30
let okStorage = 1024
function createPragma (memory, runtime, storage, timeout) {
  return [ {
    name,
    config: { memory, runtime, storage, timeout },
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
  t.plan(5)
  defaults.aws.runtime = okRuntime
  defaults.aws.memory = okMemory
  defaults.aws.storage = okStorage
  defaults.aws.timeout = okTimeout
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 0, `No errors reported (global config)`)

  defaults.aws.runtime = 'node'
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 0, `No errors reported (global config)`)

  defaults.aws.runtime = 'node.js'
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 0, `No errors reported (global config)`)

  defaults.aws.runtime = 'Node.js'
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 0, `No errors reported (global config)`)
  reset()

  defaults.events = createPragma(okMemory, okRuntime, okStorage, okTimeout)
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

  defaults.events = createPragma(127, okRuntime, okStorage, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (function config)`)
  t.ok(errors[0].includes(name), `Configuration error is Lambda-specific`)
  reset()

  defaults.aws.memory = 127
  defaults.events = createPragma(127, okRuntime, okStorage, okTimeout)
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

  defaults.events = createPragma(10241, okRuntime, okStorage, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (function config)`)
  t.ok(errors[0].includes(name), `Configuration error is Lambda-specific`)
  reset()

  defaults.aws.memory = 10241
  defaults.events = createPragma(10241, okRuntime, okStorage, okTimeout)
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

  defaults.events = createPragma(1.01, okRuntime, okStorage, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (function config)`)
  t.ok(errors[0].includes(name), `Configuration error is Lambda-specific`)
  reset()

  defaults.aws.memory = 1.01
  defaults.events = createPragma(1.01, okRuntime, okStorage, okTimeout)
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

  defaults.events = createPragma(okMemory, runtime, okStorage, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (function config)`)
  t.ok(errors[0].includes(name), `Configuration error is Lambda-specific`)
  reset()

  defaults.aws.runtime = runtime
  defaults.events = createPragma(okMemory, runtime, okStorage, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global + function config match)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)

  t.teardown(reset)
})

/**
 * Storage
 */
test('Minimum storage not met', t => {
  t.plan(6)

  defaults.aws.storage = 127
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global config)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)
  reset()

  defaults.events = createPragma(okMemory, okRuntime, 127, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (function config)`)
  t.ok(errors[0].includes(name), `Configuration error is Lambda-specific`)
  reset()

  defaults.aws.storage = 127
  defaults.events = createPragma(okMemory, okRuntime, 127, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global + function config match)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)

  t.teardown(reset)
})

test('Maximum storage exceeded', t => {
  t.plan(6)

  defaults.aws.storage = 10241
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global config)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)
  reset()

  defaults.events = createPragma(okMemory, okRuntime, 10241, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (function config)`)
  t.ok(errors[0].includes(name), `Configuration error is Lambda-specific`)
  reset()

  defaults.aws.storage = 10241
  defaults.events = createPragma(okMemory, okRuntime, 10241, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global + function config match)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)

  t.teardown(reset)
})

test('Storage is invalid', t => {
  t.plan(6)

  defaults.aws.storage = 1.01
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global config)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)
  reset()

  defaults.events = createPragma(okMemory, okRuntime, 1.01, okTimeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (function config)`)
  t.ok(errors[0].includes(name), `Configuration error is Lambda-specific`)
  reset()

  defaults.aws.storage = 1.01
  defaults.events = createPragma(okMemory, okRuntime, 1.01, okTimeout)
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

  defaults.events = createPragma(okMemory, okRuntime, okStorage, 0)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (function config)`)
  t.ok(errors[0].includes(name), `Configuration error is Lambda-specific`)
  reset()

  defaults.aws.timeout = 0
  defaults.events = createPragma(okMemory, okRuntime, okStorage, 0)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global + function config match)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)

  t.teardown(reset)
})

test('Maximum timeout exceeded', t => {
  t.plan(6)
  let timeout = (60 * 15) + 1

  defaults.aws.timeout = timeout
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global config)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)
  reset()

  defaults.events = createPragma(okMemory, okRuntime, okStorage, timeout)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (function config)`)
  t.ok(errors[0].includes(name), `Configuration error is Lambda-specific`)
  reset()

  defaults.aws.timeout = timeout
  defaults.events = createPragma(okMemory, okRuntime, okStorage, timeout)
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

  defaults.events = createPragma(okMemory, okRuntime, okStorage, 1.01)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (function config)`)
  t.ok(errors[0].includes(name), `Configuration error is Lambda-specific`)
  reset()

  defaults.aws.timeout = 1.01
  defaults.events = createPragma(okMemory, okRuntime, okStorage, 1.01)
  validateConfig(params, defaults, errors)
  t.equal(errors.length, 1, `Error reported (global + function config match)`)
  t.ok(!errors[0].includes(name), `Configuration error is not Lambda-specific`)

  t.teardown(reset)
})
