let { join } = require('path')
let { homedir } = require('os')
let test = require('tape')
let mockFs = require('mock-fs')
let cwd = process.cwd()
let sut = join(cwd, 'src', 'config', 'project', 'prefs')
let getPrefs = require(sut)

let path = join(homedir(), '.prefs.arc')
let inventory = { _project: { cwd } }
let reset = () => mockFs.restore()
function clean (preferences) {
  // Delete the meta stuff so the actual preferences match during an equality check
  delete preferences._arc
  delete preferences._raw
}

test('Set up env', t => {
  t.plan(1)
  t.ok(getPrefs, 'Preference getter module is present')
})

test('Do nothing', t => {
  t.plan(2)
  let errors = []
  let preferences = getPrefs({ scope: 'local', inventory, errors })
  t.equal(preferences, null, 'No preferences or .env returns null')
  t.notOk(errors.length, 'Did not error')
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
      staging: null,
      production: null,
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
  clean(preferences)
  t.deepEqual(preferences, prefs, 'Got correct preferences')
  t.notOk(errors.length, 'Did not error')
  t.teardown(reset)
})

test('.env file handling', t => {
  t.plan(12)
  let dotenv, errors, prefs, preferences

  /**
   * No .env file
   */
  prefs = {
    sandbox: { environment: 'testing' },
    env: {
      testing: { 'env-var-1': 'foo' },
      staging: { 'env-var-2': 'bar' },
      production: null,
    },
  }
  let prefsText = `
@sandbox
environment testing

@env
testing
  env-var-1 foo
staging
  env-var-2 bar
`
  mockFs({
    'prefs.arc': prefsText
  })
  errors = []
  preferences = getPrefs({ scope: 'local', inventory, errors }).preferences
  t.ok(preferences, 'Got preferences')
  clean(preferences)
  t.deepEqual(preferences, prefs, 'Got correct preferences from local prefs')
  t.notOk(errors.length, 'Did not error')

  /**
   * Empty .env file just nulls out env, but no others
   */
  prefs = {
    sandbox: { environment: 'testing' },
    env: { testing: null, staging: null, production: null }
  }
  mockFs({
    '.env': '# eventually',
    'prefs.arc': prefsText
  })
  errors = []
  preferences = getPrefs({ scope: 'local', inventory, errors }).preferences
  t.ok(preferences, 'Got preferences')
  clean(preferences)
  t.deepEqual(preferences, prefs, 'Got no preferences from empty .env > prefs.arc')
  t.notOk(errors.length, 'Did not error')

  /**
   * Actual .env file that overrides env prefs, but no others
   */
  dotenv = `
from-dotenv = lol
`
  prefs = {
    sandbox: { environment: 'testing' },
    env: {
      testing: { 'from-dotenv': 'lol' },
      staging: null,
      production: null,
    },
  }
  mockFs({
    '.env': dotenv,
    'prefs.arc': prefsText
  })
  errors = []
  preferences = getPrefs({ scope: 'local', inventory, errors }).preferences
  t.ok(preferences, 'Got preferences')
  clean(preferences)
  t.deepEqual(preferences, prefs, 'Got correct preferences from .env > prefs.arc')
  t.notOk(errors.length, 'Did not error')

  /**
   * .env file only, no prefs file
   */
  dotenv = `
from-dotenv = lol
`
  prefs = {
    env: {
      testing: { 'from-dotenv': 'lol' },
      staging: null,
      production: null,
    },
  }
  mockFs({
    '.env': dotenv,
  })
  errors = []
  preferences = getPrefs({ scope: 'local', inventory, errors }).preferences
  t.ok(preferences, 'Got preferences')
  clean(preferences)
  t.deepEqual(preferences, prefs, 'Got correct preferences from .env')
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
  clean(preferences)
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
