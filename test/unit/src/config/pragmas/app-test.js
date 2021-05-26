let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'app')
let populateApp = require(sut)

test('Set up env', t => {
  t.plan(1)
  t.ok(populateApp, '@app populator is present')
})

test('@app population', t => {
  t.plan(1)
  let name = 'hi-there'
  let arc

  arc = parse(`
@app
${name}
`)
  t.equal(populateApp({ arc }), name, `Returned correct app name: ${name}`)
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
  t.ok(errors.length, 'Invalid app name errored: >1 word')

  arc = parse(`
  @app
  true
  `)
  errors = []
  populateApp({ arc, errors })
  t.ok(errors.length, 'Invalid app name errored: bool')

  arc = parse(`
  @app
  0cool
  `)
  errors = []
  populateApp({ arc, errors })
  t.ok(errors.length, 'Invalid app name errored: non-lowercase alpha first char')

  arc = parse(`
@app
hello!
`)
  errors = []
  populateApp({ arc, errors })
  t.ok(errors.length, 'Invalid app name errored: invalid char')

  arc = parse(`
@app
abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-a
`)
  errors = []
  populateApp({ arc, errors })
  t.ok(errors.length, 'Invalid app name errored: too long')
})
