let { join } = require('node:path')
let { test } = require('node:test')
let cwd = process.cwd()
let { normalizeSrc } = require('../../../../src/lib')

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(normalizeSrc, 'Source path normalizer util is present')
})

test('Get src', t => {
  t.plan(2)

  let src
  let dir

  dir = 'foo'
  src = normalizeSrc(cwd, dir)
  t.assert.equal(src, join(cwd, dir), `Normalized src to cwd: ${src}`)

  dir = join(cwd, 'foo')
  src = normalizeSrc(cwd, dir)
  t.assert.equal(src, dir, `Normalized src to cwd: ${src}`)
})
