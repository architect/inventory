let { join } = require('path')
let { test } = require('node:test')
let inventoryDefaults = require('../../../../../../src/defaults')
let testLib = require('../../../../../lib')
let populateCustomLambdas = require('../../../../../../src/config/pragmas/meta/custom-lambdas')
let cwd = process.cwd()

let arc = {}
let inventory, item
let names = [
  'a-custom-lambda-0',
  'a-custom-lambda-1',
]
let srcPaths = [
  'a/source/path/0',
  'a/source/path/1',
]
let method = () => item
let setterPluginSetup = testLib.setterPluginSetup.bind({}, 'customLambdas')

let setup = () => {
  item = undefined
  inventory = inventoryDefaults()
}

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(populateCustomLambdas, 'Custom Lambda populator is present')
})

test('No custom Lambda setter plugin returns null', t => {
  t.plan(1)
  setup()
  t.assert.equal(populateCustomLambdas({ arc, inventory }), null, 'Returned null')
})

test('Custom Lambda population: single setter + single Lambda', t => {
  t.plan(4)
  setup()
  item = { name: names[0], src: srcPaths[0] }
  inventory.plugins = setterPluginSetup(method)
  let customLambdas = populateCustomLambdas({ arc, inventory })
  t.assert.equal(customLambdas.length, 1, 'Got correct number of custom Lambdas back')
  t.assert.ok(customLambdas.some(lambda => lambda.name === names[0]), `Got lambda: ${names[0]}`)
  customLambdas.forEach((lambda, i) => {
    let { handlerFile } = lambda
    t.assert.equal(lambda.src, join(cwd, srcPaths[i]), `Event configured with correct source dir: ${lambda.src}`)
    t.assert.ok(handlerFile.startsWith(lambda.src), `Handler file is in the correct source dir`)
  })
})

test('Custom Lambda population: single setter + multiple Lambdas', t => {
  t.plan(7)
  setup()
  item = [ { name: names[0], src: srcPaths[0] }, { name: names[1], src: srcPaths[1] } ]
  inventory.plugins = setterPluginSetup(method)
  let customLambdas = populateCustomLambdas({ arc, inventory })
  t.assert.equal(customLambdas.length, 2, 'Got correct number of custom Lambdas back')
  names.forEach(name => {
    t.assert.ok(customLambdas.some(lambda => lambda.name === name), `Got lambda: ${name}`)
  })
  customLambdas.forEach((lambda, i) => {
    let { handlerFile } = lambda
    t.assert.equal(lambda.src, join(cwd, srcPaths[i]), `Event configured with correct source dir: ${lambda.src}`)
    t.assert.ok(handlerFile.startsWith(lambda.src), `Handler file is in the correct source dir`)
  })
})

test('Custom Lambda population: multiple setters + multiple Lambdas', t => {
  t.plan(7)
  setup()
  let fns = [
    () => ({ name: names[0], src: srcPaths[0] }),
    () => ({ name: names[1], src: srcPaths[1] }),
  ]
  inventory.plugins = setterPluginSetup(fns)
  let customLambdas = populateCustomLambdas({ arc, inventory })
  t.assert.equal(customLambdas.length, 2, 'Got correct number of custom Lambdas back')
  names.forEach(name => {
    t.assert.ok(customLambdas.some(lambda => lambda.name === name), `Got lambda: ${name}`)
  })
  customLambdas.forEach((lambda, i) => {
    let { handlerFile } = lambda
    t.assert.equal(lambda.src, join(cwd, srcPaths[i]), `Event configured with correct source dir: ${lambda.src}`)
    t.assert.ok(handlerFile.startsWith(lambda.src), `Handler file is in the correct source dir`)
  })
})

test('Custom Lambda population: plugin errors', t => {
  t.plan(5)
  let errors = []
  function run (returning) {
    setup()
    item = returning
    inventory.plugins = setterPluginSetup(method)
    populateCustomLambdas({ arc, inventory, errors })
  }
  function check (str = 'Invalid setter return', qty = 1) {
    t.assert.equal(errors.length, qty, str)
    console.log(errors.join('\n'))
    // Run a bunch of control tests at the top by resetting errors after asserting
    errors = []
  }

  // Control
  run({ name: 'hi', src: 'hi' })
  t.assert.equal(errors.length, 0, `Valid routes did not error`)

  // Errors
  run()
  check()

  run({})
  check()

  run({ name: 'hi' })
  check()

  run({ src: 'hi' })
  check()
})
