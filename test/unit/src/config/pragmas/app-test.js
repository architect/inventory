let parse = require('@architect/parser')
let { test } = require('node:test')
let populateApp = require('../../../../../src/config/pragmas/app')

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(populateApp, '@app populator is present')
})

test('@app population', t => {
  t.plan(1)
  let name = 'hi-there'
  let arc

  arc = parse(`
@app
${name}
`)
  t.assert.equal(populateApp({ arc }), name, `Returned correct app name: ${name}`)
})

test('@app validation', t => {
  t.plan(5)
  let arc
  let errors = []

  arc = parse(`
@app
hi there
`)
  errors = []
  populateApp({ arc, errors })
  t.assert.ok(errors.length, 'Invalid app name errored: >1 word')

  arc = parse(`
  @app
  true
  `)
  errors = []
  populateApp({ arc, errors })
  t.assert.ok(errors.length, 'Invalid app name errored: bool')

  arc = parse(`
  @app
  0cool
  `)
  errors = []
  populateApp({ arc, errors })
  t.assert.ok(errors.length, 'Invalid app name errored: non-lowercase alpha first char')

  arc = parse(`
@app
hello!
`)
  errors = []
  populateApp({ arc, errors })
  t.assert.ok(errors.length, 'Invalid app name errored: invalid char')

  arc = parse(`
@app
abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-a
`)
  errors = []
  populateApp({ arc, errors })
  t.assert.ok(errors.length, 'Invalid app name errored: too long')
})
