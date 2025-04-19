let { readdirSync } = require('node:fs')
let { join } = require('node:path')
let { test } = require('node:test')
let inventory = require('../../')
let { all: pragmas } = require('../../src/lib/pragmas')
let visitorDir = join(process.cwd(), 'src', 'config', 'pragmas')

test('Each registered pragma has a visitor', t => {
  t.plan(1)
  let ignore = [ 'src-dirs.js', 'index.js' ]
  let isPragma = f => f.endsWith('.js') && !ignore.includes(f)
  let visitors = readdirSync(visitorDir).filter(isPragma).map(p => p.replace('.js', '')).sort()
  t.assert.deepEqual(pragmas, visitors, `Got a visitor for each registered pragma:`)
  t.diagnostic(visitors.map(v => `- @${v}`).join('\n'))
})

// Super simple smoke test to make sure various pragma interdependencies don't blow up
test('Each pragma can be inventoried', async t => {
  t.plan(pragmas.length)
  let mocks = join(process.cwd(), 'test', 'mock', 'pragmas')
  for (const pragma of pragmas) {
    await inventory({ cwd: join(mocks, pragma), env: false })
    t.assert.ok(true, `Successfully inventoried @${pragma}`)
  }
})
