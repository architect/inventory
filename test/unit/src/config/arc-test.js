let { join } = require('path')
let mockTmp = require('mock-tmp')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', 'arc')
let getArcConfig = require(sut)

test('Set up env', t => {
  t.plan(1)
  t.ok(getArcConfig, 'Arc config module is present')
})

test('Set Arc version (if possible)', t => {
  t.plan(1)
  let path = join('node_modules', '@architect', 'architect', 'package.json')
  let version = 'lol'
  let json = JSON.stringify({ version })
  let cwd = mockTmp({ [path]: json })
  let arc = getArcConfig({ cwd, inventory: { _arc: {} } })
  t.equal(arc.version, version, 'Got back installed arc version')
  mockTmp.reset()
})
