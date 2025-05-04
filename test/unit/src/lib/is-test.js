let { join } = require('node:path')
let { test } = require('node:test')
let is = require('../../../../src/lib/is')
let cwd = process.cwd()
let mock = join(process.cwd(), 'test', 'mock', 'max')

test('Set up env', t => {
  t.plan(1)
  process.chdir(mock)
  t.assert.ok(is, 'is util is present')
})

test('Test is methods', t => {
  t.plan(12)

  t.assert.ok(is.array([]), 'Array returns true')
  t.assert.ok(!is.array(true), '!Array returns false')

  t.assert.ok(is.bool(true), 'bool returns true')
  t.assert.ok(!is.bool('hi'), '!bool returns false')

  t.assert.ok(is.object({ hi: 'there' }), 'object returns true')
  t.assert.ok(!is.object(true), '!object returns false')

  t.assert.ok(is.string('howdy'), 'string returns true')
  t.assert.ok(!is.string(true), '!string returns false')

  t.assert.ok(is.exists('app.arc'), 'exists returns true')
  t.assert.ok(!is.exists('whatever'), '!exists returns false')

  t.assert.ok(is.folder('src'), 'folder returns true')
  t.assert.ok(!is.folder('app.arc'), '!folder returns false')
})

test('Teardown', t => {
  t.plan(1)
  process.chdir(cwd)
  t.assert.ok(true, 'All done')
})
