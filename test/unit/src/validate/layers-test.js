let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'validate', 'layers')
let layerCheck = require(sut)

let region = 'us-west-1'

test('Set up env', t => {
  t.plan(1)
  t.ok(layerCheck, 'Layer validator is present')
})

test('Do nothing', t => {
  t.plan(2)
  layerCheck({}, err => {
    if (err) t.fail(err)
    t.pass('Did nothing')
  })
  layerCheck({ layers: [] }, err => {
    if (err) t.fail(err)
    t.pass('Did nothing')
  })
})

test('Valid layer', t => {
  t.plan(1)
  let layers = [
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:version`
  ]
  layerCheck({ layers, region }, err => {
    if (err) t.fail(err)
    t.pass('No errors returned')
  })
})

test('Maximum of 5 layers', t => {
  t.plan(1)
  let layers = [
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:1`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:2`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:3`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:4`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:5`,
  ]
  layerCheck({ layers, region }, err => {
    if (err) t.fail(err)
    t.pass('No errors returned')
  })
})

test('Too many layers', t => {
  t.plan(1)
  let layers = [
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:1`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:2`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:3`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:4`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:5`,
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:6`,
  ]
  layerCheck({ layers, region, location: '/idk/whatev' }, err => {
    if (!err) t.fail('Expected an error')
    t.ok(err.message.includes('Lambda can only be configured with up to 5 layers'), `Too many layers returned an error:`)
    console.log(err.message)
  })
})

test('Invalid layers', t => {
  t.plan(4)
  let layers

  layers = [ `arn:aws:lambda:us-east-1:123456789012:layer:layer-name:version` ]
  layerCheck({ layers, region }, err => {
    if (!err) t.fail('Expected an error')
    t.ok(err.message.includes('Lambda layers must be in the same region as app'), `Wrong layer region returned an error:`)
    console.log(err.message)
  })

  layers = [ `arn:aws:lambda:${region}:123456789012:layer` ]
  layerCheck({ layers, region }, err => {
    if (!err) t.fail('Expected an error')
    t.ok(err.message.includes('Invalid ARN'), `Invalid ARN returned an error:`)
    console.log(err.message)
  })

  layers = [ true ]
  layerCheck({ layers, region }, err => {
    if (!err) t.fail('Expected an error')
    t.ok(err.message.includes('Invalid ARN'), `Invalid ARN returned an error:`)
    console.log(err.message)
  })

  layers = [ `arn:aws:lambda:${region}:123456789012:layer`, true ]
  layerCheck({ layers, region }, err => {
    if (!err) t.fail('Expected an error')
    t.ok(err.message.includes(layers[0]) && err.message.includes(layers[1]), `Invalid ARNs returned multiple errors:`)
    console.log(err.message)
  })
})

test('Blow up if no region is supplied', t => {
  t.plan(1)
  let layers = [
    `arn:aws:lambda:${region}:123456789012:layer:layer-name:version`
  ]
  t.throws(() => {
    layerCheck({ layers })
  }, `Missing region blows up Inventory`)
})
