let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'macromodules')
let macroMods = require(sut)

test('Set up env', t => {
  t.plan(1)
  t.ok(macroMods, '@macros module populator is present')
})

test('No @macros returns empty object for macroModules', t => {
  t.plan(1)
  t.equal(Object.keys(macroMods({ arc: {} })).length, 0, 'Returned empty object')
})
