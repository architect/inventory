let { join } = require('path')
let mockFs = require('mock-fs')
let test = require('tape')
let _defaults = join(process.cwd(), 'src', 'defaults')
let defaultConfig = require(_defaults)
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'populate-lambda')
let populateLambda = require(sut)

test('Set up env', t => {
  t.plan(2)
  t.ok(populateLambda, 'Lambda populator is present')
  t.ok(defaultConfig, 'Default config is present')
})

test('Per-function AWS/ARC config', t => {
  t.plan(4)
  let inventory = defaultConfig()
  inventory._project.src = '/nada'
  let configPath = `${inventory._project.src}/src/events/configured-event/config.arc`
  let config = `@aws
timeout 10
memory 128
runtime python3.8

@arc
custom setting
`
  mockFs({ [configPath]: config })
  inventory.events = [
    'unconfigured-event',
    'configured-event',
  ]
  let errors = []
  let lambdas = populateLambda.events(inventory.events, inventory, errors)
  t.deepEqual(lambdas[0].config, inventory._project.defaultFunctionConfig, 'Config was unmodified')
  let modified = {
    timeout: 10,
    memory: 128,
    runtime: `python3.8`,
    custom: 'setting'
  }
  t.deepEqual(lambdas[1].config, { ...inventory._project.defaultFunctionConfig, ...modified }, 'Config was correctly upserted')
  t.notOk(errors.length, 'No errors returned')
  mockFs.restore()

  // Now return a Lambda config error
  config = `lolidk`
  mockFs({ [configPath]: config })
  lambdas = populateLambda.events(inventory.events, inventory, errors)
  t.equal(errors.length, 1, `Invalid Lambda config returned error: ${errors[0]}`)
  mockFs.restore()
})
