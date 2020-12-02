let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'lib', 'is')
let is = require(sut)
let cwd = process.cwd()
let mock = join(process.cwd(), 'test', 'mock', 'max')


test('Set up env', t => {
  t.plan(1)
  process.chdir(mock)
  t.ok(is, 'is util is present')
})

test('Test is methods', t => {
  t.plan(12)

  t.ok(is.array([]), 'Array returns true')
  t.notOk(is.array(true), '!Array returns false')

  t.ok(is.bool(true), 'bool returns true')
  t.notOk(is.bool('hi'), '!bool returns false')

  t.ok(is.object({ hi: 'there' }), 'object returns true')
  t.notOk(is.object(true), '!object returns false')

  t.ok(is.string('howdy'), 'string returns true')
  t.notOk(is.string(true), '!string returns false')

  t.ok(is.exists('app.arc'), 'exists returns true')
  t.notOk(is.exists('whatever'), '!exists returns false')

  t.ok(is.folder('src'), 'folder returns true')
  t.notOk(is.folder('app.arc'), '!folder returns false')
})

test('Teardown', t => {
  t.plan(1)
  process.chdir(cwd)
  t.pass('All done')
})
