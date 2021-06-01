let { join } = require('path')
let mockFs = require('mock-fs')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', 'arc')
let getArcConfig = require(sut)

test('Set up env', t => {
  t.plan(1)
  t.ok(getArcConfig, 'Arc config module is present')
})

test('Set Arc version (if possible)', t => {
  t.plan(1)
  let cwd = process.cwd()
  let path = join(cwd, 'node_modules', '@architect', 'architect', 'package.json')
  let version = 'lol'
  let json = JSON.stringify({ version })
  mockFs({ [path]: json })
  let arc = getArcConfig({ cwd, inventory: { _arc: {} } })
  t.equal(arc.version, version, 'Got back installed arc version')
  mockFs.restore()
})
