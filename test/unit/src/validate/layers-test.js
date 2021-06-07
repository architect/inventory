let { join } = require('path')
let test = require('tape')
let inventoryDefaultsPath = join(process.cwd(), 'src', 'defaults')
let inventoryDefaults = require(inventoryDefaultsPath)
let sut = join(process.cwd(), 'src', 'validate', 'layers')
let validateLayers = require(sut)

let defaults = inventoryDefaults()
let region = 'us-west-2'
let params = { cwd: '/foo' }
let reset = () => defaults = inventoryDefaults()

test('Set up env', t => {
  t.plan(1)
  t.ok(validateLayers, 'Layer validator is present')
})

test('Do nothing', t => {
  t.plan(2)
  let errors
  errors = []
  validateLayers(params, defaults, errors)
  t.equal(errors.length, 0, `No errors reported`)

  errors = []
  defaults.aws.layers = []
  validateLayers(params, defaults, errors)
  t.equal(errors.length, 0, `No errors reported`)

  t.teardown(reset)
})

test('Valid layer', t => {
  t.plan(1)
  let errors = []
  defaults.aws.layers = [
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:version`
  ]
  validateLayers(params, defaults, errors)
  t.equal(errors.length, 0, `No errors reported`)

  t.teardown(reset)
})

test('Maximum of 5 layers', t => {
  t.plan(1)
  let errors = []
  defaults.aws.layers = [
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:1`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:2`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:3`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:4`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:5`,
  ]
  validateLayers(params, defaults, errors)
  t.equal(errors.length, 0, `No errors reported`)

  t.teardown(reset)
})

test('Too many layers', t => {
  t.plan(2)
  let errors = []
  defaults.aws.layers = [
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:1`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:2`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:3`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:4`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:5`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:6`,
  ]
  validateLayers(params, defaults, errors)
  t.equal(errors.length, 1, `Got back an error`)
  t.ok(errors[0].includes('Lambda can only be configured with up to 5 layers'), `Too many layers returned an error:`)
  console.log(errors)

  t.teardown(reset)
})

test('Invalid layers', t => {
  t.plan(8)
  let errors

  errors = []
  defaults.aws.layers = [
    `arn:aws:lambda:us-east-1:123456789012:layer:layer-name:version`
  ]
  validateLayers(params, defaults, errors)
  t.equal(errors.length, 1, `Got back an error`)
  t.ok(errors[0].includes('Lambda layers must be in the same region as app'), `Wrong layer region returned an error:`)
  console.log(errors)
  reset()

  errors = []
  defaults.aws.layers = [
    `arn:aws:lambda:${region}:123456789012:layer`
  ]
  validateLayers(params, defaults, errors)
  t.equal(errors.length, 1, `Got back an error`)
  t.ok(errors[0].includes('Invalid ARN'), `Invalid ARN returned an error:`)
  console.log(errors)
  reset()

  errors = []
  defaults.aws.layers = [ true ]
  validateLayers(params, defaults, errors)
  t.equal(errors.length, 1, `Got back an error`)
  t.ok(errors[0].includes('Invalid ARN'), `Invalid ARN returned an error:`)
  console.log(errors)
  reset()

  errors = []
  defaults.aws.layers = [
    `arn:aws:lambda:${region}:123456789012:layer`,
    true
  ]
  let layers = defaults.aws.layers
  validateLayers(params, defaults, errors)
  t.equal(errors.length, 2, `Got back errors`)
  t.ok(errors[0].includes(layers[0]) && errors[1].includes(layers[1]), `Invalid ARNs returned multiple errors:`)
  console.log(errors)

  t.teardown(reset)
})

test('Blow up if no region is supplied', t => {
  t.plan(1)
  t.throws(() => {
    defaults.aws.region = null
    validateLayers(params, defaults, [])
  }, `Missing region blows up Inventory`)

  t.teardown(reset)
})
