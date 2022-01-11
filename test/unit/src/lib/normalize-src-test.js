let { join } = require('path')
let test = require('tape')
let cwd = process.cwd()
let sut = join(cwd, 'src', 'lib')
let { normalizeSrc } = require(sut)

test('Set up env', t => {
  t.plan(1)
  t.ok(normalizeSrc, 'Source path normalizer util is present')
})

test('Get src', t => {
  t.plan(2)

  let src
  let dir

  dir = 'foo'
  src = normalizeSrc(cwd, dir)
  t.equal(src, join(cwd, dir), `Normalized src to cwd: ${src}`)

  dir = join(cwd, 'foo')
  src = normalizeSrc(cwd, dir)
  t.equal(src, dir, `Normalized src to cwd: ${src}`)
})
