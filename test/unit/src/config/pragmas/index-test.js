let { test } = require('node:test')
let configArcPragmas = require('../../../../../src/config/pragmas')

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(configArcPragmas, 'Arc pragma configurator is present')
})

test('We only support AWS right now', t => {
  t.plan(1)
  let inventory = { _project: { type: '!aws' } }
  t.assert.throws(() => {
    configArcPragmas({ arc: {}, inventory })
  }, 'Invalid project type throws')
})
