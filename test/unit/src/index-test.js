let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'index')
let inv = require(sut)

test('Set up env', t => {
  t.plan(1)
  t.ok(inv, 'Inventory entry is present')
})
