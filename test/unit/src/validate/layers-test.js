let { join } = require('node:path')
let { test } = require('node:test')
let inventoryDefaults = require('../../../../src/defaults')
let validateLayers = require('../../../../src/validate/layers')

let errors = []
let defaults = inventoryDefaults()
let region = 'us-west-2'
let params = { cwd: '/foo' }
let reset = () => {
  if (errors[0]) console.log(errors[0])
  defaults = inventoryDefaults()
  errors = []
}

// Apply reset before each test
test.beforeEach(reset)

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(validateLayers, 'Layer validator is present')
})

test('Do nothing', t => {
  t.plan(2)
  validateLayers(params, defaults, errors)
  t.assert.equal(errors.length, 0, `No errors reported`)
  reset()

  defaults.aws.layers = []
  validateLayers(params, defaults, errors)
  t.assert.equal(errors.length, 0, `No errors reported`)
})

test('Valid layer', t => {
  t.plan(1)
  defaults.aws.layers = [
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:version`,
  ]
  validateLayers(params, defaults, errors)
  t.assert.equal(errors.length, 0, `No errors reported`)
})

test('Maximum of 5 layers', t => {
  t.plan(1)
  defaults.aws.layers = [
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:1`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:2`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:3`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:4`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:5`,
  ]
  validateLayers(params, defaults, errors)
  t.assert.equal(errors.length, 0, `No errors reported`)
})

test('Too many layers', t => {
  t.plan(2)
  defaults.aws.layers = [
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:1`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:2`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:3`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:4`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:5`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:6`,
  ]
  validateLayers(params, defaults, errors)
  t.assert.equal(errors.length, 1, `Got back an error`)
  t.assert.ok(errors[0].includes('Lambdas can only be configured with up to 5 layers'), `Too many layers returned an error:`)
})

test('Invalid layers', t => {
  t.plan(8)
  defaults.aws.layers = [
    `arn:aws:lambda:us-east-1:123456789012:layer:layer-name:version`,
  ]
  validateLayers(params, defaults, errors)
  t.assert.equal(errors.length, 1, `Got back an error`)
  t.assert.ok(errors[0].includes(`Layer not in app's region of`), `Wrong layer region returned an error:`)
  reset()

  defaults.aws.layers = [
    `arn:aws:lambda:${region}:123456789012:layer`,
  ]
  validateLayers(params, defaults, errors)
  t.assert.equal(errors.length, 1, `Got back an error`)
  t.assert.ok(errors[0].includes('Invalid ARN'), `Invalid ARN returned an error:`)
  reset()

  defaults.aws.layers = [ true ]
  validateLayers(params, defaults, errors)
  t.assert.equal(errors.length, 1, `Got back an error`)
  t.assert.ok(errors[0].includes('Invalid ARN'), `Invalid ARN returned an error:`)
  reset()

  defaults.aws.layers = [
    `arn:aws:lambda:${region}:123456789012:layer`,
    true,
  ]
  let layers = defaults.aws.layers
  validateLayers(params, defaults, errors)
  t.assert.equal(errors.length, 1, `Got back errors`)
  t.assert.ok(errors[0].includes(layers[0]) && errors[0].includes(layers[1]), `Invalid ARNs returned error:`)
})


test('Skip layer validation', t => {
  t.plan(1)
  defaults.aws.layers = [ true ]
  validateLayers({ ...params, validateLayers: false }, defaults, errors)
  t.assert.equal(errors.length, 0, `No errors reported`)
})

test('Blow up if no region is supplied', t => {
  t.plan(1)
  t.assert.throws(() => {
    defaults.aws.region = null
    validateLayers(params, defaults, [])
  }, `Missing region blows up Inventory`)
})
