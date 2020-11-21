let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'index')
let inv = require(sut)
let mockFs = require('mock-fs')

let dir = process.cwd()
let mock = join(process.cwd(), 'test', 'mock')
function reset () {
  process.chdir(dir)
}

test('Set up env', t => {
  t.plan(1)
  t.ok(inv, 'Inventory entry is present')
})

test('Get preferences', t => {
  t.plan(6)
  let cwd = join(mock, 'max')
  let prefs = {
    sandbox: { environment: 'testing' },
    create: { autocreate: true },
    deploy: false,
    env: {
      testing: { 'env-var-1': 'foo', 'env-var-2': 'bar' },
      staging: { 'env-var-1': 'fiz', 'env-var-2': 'buz' },
      production: { 'env-var-1': 'qix qix', 'env-var-2': 'qux qux' }
    }
  }
  inv({ cwd }, (err, result) => {
    if (err) t.fail(err)
    else {
      let { inv, get } = result
      t.ok(inv, 'Inventory returned inventory object')
      t.ok(get, 'Inventory returned getter')
      t.ok(inv._project.preferences._arc, 'Got preferences (arc)')
      t.ok(inv._project.preferences._raw, 'Got preferences (raw)')
      // Delete the meta stuff so the actual preferences match the above
      delete inv._project.preferences._arc
      delete inv._project.preferences._raw
      t.deepEqual(inv._project.preferences, prefs, 'Got correct preferences')
      t.equal(inv._project.preferencesFile, join(cwd, 'preferences.arc'), 'Got correct preferences file')
      reset()
    }
  })
})

test('Preferences validation', async t => {
  t.plan(3)
  let prefs
  prefs = `
@env
testing
  env-var-1 foo
  env-var-2 bar

staging
`
  mockFs({ 'prefs.arc': prefs })
  try {
    await inv({})
    t.fail('Expected an error')
  }
  catch (err) {
    t.equal(err.message, 'Invalid preferences setting: @env staging', 'Got back error message for invalid preference shape')
  }

  prefs = `
@env
testing
  env-var-1 foo
  env-var-2 bar

staging true

production
  env-var-1 foo
  env-var-2 bar
`
  mockFs({ 'prefs.arc': prefs })
  try {
    await inv({})
    t.fail('Expected an error')
  }
  catch (err) {
    t.equal(err.message, 'Invalid preferences setting: @env staging', 'Got back error message for invalid preference shape')
  }

  prefs = `
@env
testing foo

staging
  env-var-1 foo
  env-var-2 bar
`
  mockFs({ 'prefs.arc': prefs })
  try {
    await inv({})
    t.fail('Expected an error')
  }
  catch (err) {
    t.equal(err.message, 'Invalid preferences setting: @env testing', 'Got back error message for invalid preference shape')
  }
})

test('Teardown', t => {
  t.plan(1)
  mockFs.restore()
  t.pass('Restored fs')
})
