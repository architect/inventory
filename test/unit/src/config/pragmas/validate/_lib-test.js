let { test } = require('node:test')
let validate = require('../../../../../../src/config/pragmas/validate/_lib')

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(validate, 'Validate lib is present')
})

test('Regex method', t => {
  t.plan(3)
  let errors = []

  validate.regex('hi', 'looseName', [], errors)
  t.assert.ok(!errors.length, 'Regex check did not error')

  validate.regex('hi!!!', 'looseName', [], errors)
  t.assert.equal(errors.length, 1, `Regex check errored: ${errors[0]}`)

  t.assert.throws(() => {
    validate.regex('hi', 'there', [], [])
  }, 'Invalid regex pattern throws')
})

test('Size method', t => {
  t.plan(5)
  let errors = []

  validate.size('hi', 1, 10, '@meh', errors)
  t.assert.ok(!errors.length, 'Size check did not error')

  validate.size(true, 1, 10, '@meh', errors)
  t.assert.equal(errors.length, 1, `Size check errored: ${errors[0]}`)
  errors = []

  validate.size('hello', 1, 2, '@meh', errors)
  t.assert.equal(errors.length, 1, `Size check errored: ${errors[0]}`)
  errors = []

  validate.size('hello', 6, 10, '@meh', errors)
  t.assert.equal(errors.length, 1, `Size check errored: ${errors[0]}`)
  errors = []

  t.assert.throws(() => {
    validate.size('hi', 'there')
  }, 'Invalid size throws')
})

test('Unique method', t => {
  t.plan(4)
  let errors = []
  let lambdas

  lambdas = []
  validate.unique(lambdas, '@meh', errors)
  t.assert.ok(!errors.length, 'Unique check did not error')

  lambdas = [
    { name: 'one' },
    { name: 'two' },
  ]
  validate.unique(lambdas, '@meh', errors)
  t.assert.ok(!errors.length, 'Unique check did not error')

  lambdas = [
    { name: 'one' },
    { name: 'one' },
  ]
  validate.unique(lambdas, '@meh', errors)
  t.assert.equal(errors.length, 1, `Unique check errored: ${errors[0]}`)

  t.assert.throws(() => {
    validate.unique('hi')
  }, 'Invalid unique throws')
})
