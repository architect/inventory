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

  arc = parse(`
@app
hi there
`)
  t.throws(() => {
    populateApp({ arc })
  }, 'Invalid app name threw: >1 word')

  arc = parse(`
@app
true
`)
  t.throws(() => {
    populateApp({ arc })
  }, 'Invalid app name threw: bool')

  arc = parse(`
@app
0cool
`)
  t.throws(() => {
    populateApp({ arc })
  }, 'Invalid app name threw: non-lowercase alpha first char')

  arc = parse(`
@app
hello!
`)
  t.throws(() => {
    populateApp({ arc })
  }, 'Invalid app name threw: invalid char')

  arc = parse(`
@app
abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-a
`)
  t.throws(() => {
    populateApp({ arc })
  }, 'Invalid app name threw: too long')
})
