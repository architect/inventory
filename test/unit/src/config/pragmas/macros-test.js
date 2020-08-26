let { join } = require('path')
let parse = require('@architect/parser')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', 'pragmas', 'macros')
let populateMacros = require(sut)

test('Set up env', t => {
  t.plan(1)
  t.ok(populateMacros, '@macros populator is present')
})

test('No @macros returns null', t => {
  t.plan(1)
  t.equal(populateMacros({ arc: {} }), null, 'Returned null')
})

test('@macros population', t => {
  t.plan(3)

  let values = [
    'architect/macro-node-prune',
    'custom-macro'
  ]

  let arc = parse(`
@macros
${values.join('\n')}
`)
  let macros = populateMacros({ arc })
  t.equal(macros.length, values.length, 'Got correct number of macros back')
  t.equal(macros[0], values[0], `Got correct macro back: ${macros[0]}`)
  t.equal(macros[1], values[1], `Got correct macro back: ${macros[1]}`)
})
