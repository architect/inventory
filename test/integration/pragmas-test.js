let { readdirSync } = require('fs')
let { join } = require('path')
let test = require('tape')
let inventory = require(process.cwd())
let { all: pragmas } = require(join(process.cwd(), 'src', 'lib', 'pragmas'))
let visitorDir = join(process.cwd(), 'src', 'config', 'pragmas')

test('Each registered pragma has a visitor', t => {
  t.plan(1)
  let ignore = [ 'src-dirs.js', 'index.js' ]
  let isPragma = f => f.endsWith('.js') && !ignore.includes(f)
  let visitors = readdirSync(visitorDir).filter(isPragma).map(p => p.replace('.js', ''))
  t.deepEqual(pragmas, visitors, `Got a visitor for each registered pragma:`)
  console.log(visitors.map(v => `- @${v}`).join('\n'))
})

// Super simple smoke test to make sure various pragma interdependencies don't blow up
test('Each pragma can be inventoried', t => {
  t.plan(pragmas.length)
  let mocks = join(process.cwd(), 'test', 'mock', 'pragmas')
  pragmas.forEach(async pragma => {
    try {
      await inventory({ cwd: join(mocks, pragma), env: false })
      t.pass(`Successfully inventoried @${pragma}`)
    }
    catch (err) {
      console.log(`Failed to inventory @${pragma}:`)
      console.log(err)
      t.fail()
    }
  })
})
