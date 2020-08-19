let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'defaults', 'function-config')
let functionConfig = require(sut)

test('Set up env', t => {
  t.plan(1)
  t.ok(functionConfig, 'Function config module is present')
})

test('Function config returns correct defaults', t => {
  t.plan(9)
  let result = functionConfig()
  t.equal(Object.keys(result).length, 8, 'Got correct number of params')
  t.ok(result.timeout, 'Got timeout')
  t.ok(result.memory, 'Got memory')
  t.ok(result.runtime, 'Got runtime')
  t.ok(result.handler, 'Got handler')
  t.ok(result.state, 'Got state')
  t.ok(result.concurrency, 'Got concurrency')
  t.ok(result.layers, 'Got layers')
  t.ok(result.policies, 'Got policies')
})
