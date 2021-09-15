let { join } = require('path')
let { homedir } = require('os')
let test = require('tape')
let mockFs = require('mock-fs')
let sut = join(process.cwd(), 'src', 'config', 'project', 'prefs')
let getPrefs = require(sut)

let path = join(homedir(), '.prefs.arc')
let inventory = { _project: {} }
let reset = () => mockFs.restore()

test('Set up env', t => {
  t.plan(1)
  t.ok(getPrefs, 'Preference getter module is present')
})

test('Get preferences', t => {
  t.plan(6)
  let prefs = {
    sandbox: { environment: 'testing' },
    'sandbox-startup': [
      'ls',
      'echo hi',
      'echo hello',
      'echo hello there',
      `echo hi there`,
      `echo hi there`,
      `echo hi #here`,
    ],
    env: {
      testing: { 'env-var-1': 'foo', 'env-var-2': 'bar' },
    },
  }
  let prefsText = `
@sandbox
environment testing

@sandbox-startup
ls
echo hi
echo hello
echo hello there
echo "hi there"
echo 'hi there'
echo "hi #here"

@env
testing
  env-var-1 foo
  env-var-2 bar
`
  mockFs({
    [path]: prefsText
  })

  let errors = []
  let { preferences, preferencesFile } = getPrefs({ scope: 'global', inventory, errors })
  t.ok(preferences, 'Got preferences')
  t.ok(preferences._arc, 'Got (arc object)')
  t.ok(preferences._raw, 'Got (raw file)')
  t.ok(preferencesFile, 'Got preferencesFile')
  // Delete the meta stuff so the actual preferences match the above
  delete preferences._arc
  delete preferences._raw
  t.deepEqual(preferences, prefs, 'Got correct preferences')
  t.notOk(errors.length, 'Did not error')
  t.teardown(reset)
})

test('Get preferences (only unknown items)', t => {
  t.plan(6)
  let prefs = { idk: { userland: true } }
  let prefsText = `
@idk
userland true
`
  mockFs({
    [path]: prefsText
  })
  let errors = []
  let { preferences, preferencesFile } = getPrefs({ scope: 'global', inventory, errors })
  t.ok(preferences, 'Got preferences')
  t.ok(preferences._arc, 'Got (arc object)')
  t.ok(preferences._raw, 'Got (raw file)')
  t.ok(preferencesFile, 'Got preferencesFile')
  // Delete the meta stuff so the actual preferences match the above
  delete preferences._arc
  delete preferences._raw
  t.deepEqual(preferences, prefs, 'Got correct preferences')
  t.notOk(errors.length, 'Did not error')
  t.teardown(reset)
})

test('Validate preferences', t => {
  t.plan(5)
  let mock = () => mockFs({ [path]: prefsText })
  let prefsText
  let errors

  // Invalid @env pragma
  prefsText = `
@env
foo
`
  mock()
  errors = []
  getPrefs({ scope: 'global', inventory, errors })
  t.equal(errors.length, 1, `Invalid preferences errored: ${errors[0]}`)

  // Invalid @env environments
  prefsText = `
@env
staging
  foo
`
  mock()
  errors = []
  getPrefs({ scope: 'global', inventory, errors })
  t.equal(errors.length, 1, `Invalid preferences errored: ${errors[0]}`)

  prefsText = `
@env
testing
  env-var-1 foo
  env-var-2 bar

staging
`
  mock()
  errors = []
  getPrefs({ scope: 'global', inventory, errors })
  t.equal(errors.length, 1, `Invalid preferences errored: ${errors[0]}`)

  prefsText = `
@env
testing
  env-var-1 foo
  env-var-2 bar

staging true

production
  env-var-1 foo
  env-var-2 bar
`
  mock()
  errors = []
  getPrefs({ scope: 'global', inventory, errors })
  t.equal(errors.length, 1, `Invalid preferences errored: ${errors[0]}`)

  prefsText = `
@env
testing foo

staging
  env-var-1 foo
  env-var-2 bar
`
  mock()
  errors = []
  getPrefs({ scope: 'global', inventory, errors })
  t.equal(errors.length, 1, `Invalid preferences errored: ${errors[0]}`)

  t.teardown(reset)
})
