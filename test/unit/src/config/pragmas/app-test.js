let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'app')
let populateApp = require(sut)

test('Set up env', t => {
  t.plan(1)
  t.ok(populateApp, 'Event Lambda populator is present')
})

test('Test @app population', t => {
  t.plan(2)
  let name = 'hi-there'
  let arc

  arc = parse(`
@app
${name}
`)
  t.equal(populateApp({ arc }), name)

  arc = parse(`
@app
hi there
`)
  t.throws(() => {
    populateApp({ arc })
  }, 'Invalid app name threw')
})
