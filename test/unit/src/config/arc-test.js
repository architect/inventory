let { join } = require('node:path')
let mockTmp = require('mock-tmp')
let { test } = require('node:test')
let getArcConfig = require('../../../../src/config/arc')

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(getArcConfig, 'Arc config module is present')
})

test('Set Arc version (if possible)', t => {
  t.plan(1)
  let path = join('node_modules', '@architect', 'architect', 'package.json')
  let version = 'lol'
  let json = JSON.stringify({ version })
  let cwd = mockTmp({ [path]: json })
  let arc = getArcConfig({ cwd, inventory: { _arc: {} } })
  t.assert.equal(arc.version, version, 'Got back installed arc version')
  mockTmp.reset()
})
