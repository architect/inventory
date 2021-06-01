let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'config', 'pragmas')
let configArcPragmas = require(sut)

test('Set up env', t => {
  t.plan(1)
  t.ok(configArcPragmas, 'Arc pragma configurator is present')
})

test('We only support AWS right now', t => {
  t.plan(1)
  let inventory = { _project: { type: '!aws' } }
  t.throws(() => {
    configArcPragmas({ arc: {}, inventory })
  }, 'Invalid project type throws')
})
