let { test } = require('node:test')
let mockTmp = require('mock-tmp')
let cwd = process.cwd()
let { overrideHomedir } = require('../../../../../lib/')
let inventoryDefaults = require('../../../../../../src/defaults')
let getPrefs = require('../../../../../../src/config/project/prefs')

let path = '.prefs.arc'
let reset = () => {
  mockTmp.reset()
  overrideHomedir.reset()
}
test.beforeEach(reset)
function clean (preferences) {
  // Delete the meta stuff so the actual preferences match during an equality check
  delete preferences._arc
  delete preferences._raw
}

test('Set up env', t => {
  t.plan(1)
  t.assert.ok(getPrefs, 'Preference getter module is present')
})

test('Do nothing', t => {
  t.plan(2)
  let errors = []
  let inventory = inventoryDefaults()
  let preferences = getPrefs({ scope: 'local', inventory, errors })
  t.assert.equal(preferences, null, 'No preferences or .env returns null')
  t.assert.ok(!errors.length, 'Did not error')
})

test('Get preferences', t => {
  t.plan(6)
  let prefs = {
    sandbox: { environment: 'testing' },
    'sandbox-start': [
      'ls',
      'echo hi',
      'echo hello',
      'echo hello there',
    ],
    'sandbox-startup': [
      `echo hi there`,
      `echo hi there`,
      `echo hi #here`,
    ],
    env: {
      testing: { 'env_var_1': 'foo', 'env_var_2': 'bar' },
      staging: null,
      production: null,
    },
  }
  let prefsText = `
@sandbox
environment testing

@sandbox-start
ls
echo hi
echo hello
echo hello there

@sandbox-startup
echo "hi there"
echo 'hi there'
echo "hi #here"

@env
testing
  env_var_1 foo
  env_var_2 bar
`
  let tmp = mockTmp({
    [path]: prefsText,
  })
  overrideHomedir(tmp)
  let inventory = inventoryDefaults({ cwd })

  let errors = []
  let { preferences, preferencesFile } = getPrefs({ scope: 'global', inventory, errors })
  t.assert.ok(preferences, 'Got preferences')
  t.assert.ok(preferences._arc, 'Got (arc object)')
  t.assert.ok(preferences._raw, 'Got (raw file)')
  t.assert.ok(preferencesFile, 'Got preferencesFile')
  clean(preferences)
  t.assert.deepEqual(preferences, prefs, 'Got correct preferences')
  t.assert.ok(!errors.length, 'Did not error')
})

test('.env file handling', t => {
  t.plan(12)
  let cwd, dotenv, errors, inventory, prefs, preferences

  /**
   * No .env file
   */
  prefs = {
    sandbox: { environment: 'testing' },
    env: {
      testing: { 'env_var_1': 'foo' },
      staging: { 'env_var_2': 'bar' },
      production: null,
    },
  }
  let prefsText = `
@sandbox
environment testing

@env
testing
  env_var_1 foo
staging
  env_var_2 bar
`
  cwd = mockTmp({
    'prefs.arc': prefsText,
  })
  inventory = inventoryDefaults({ cwd })

  errors = []
  preferences = getPrefs({ scope: 'local', inventory, errors }).preferences
  t.assert.ok(preferences, 'Got preferences')
  clean(preferences)
  t.assert.deepEqual(preferences, prefs, 'Got correct preferences from local prefs')
  t.assert.ok(!errors.length, 'Did not error')

  /**
   * Empty .env file just nulls out env, but no others
   */
  prefs = {
    sandbox: { environment: 'testing' },
    env: { testing: null, staging: null, production: null },
  }
  cwd = mockTmp({
    '.env': '# eventually',
    'prefs.arc': prefsText,
  })
  inventory = inventoryDefaults({ cwd })
  errors = []
  preferences = getPrefs({ scope: 'local', inventory, errors }).preferences
  t.assert.ok(preferences, 'Got preferences')
  clean(preferences)
  t.assert.deepEqual(preferences, prefs, 'Got no preferences from empty .env > prefs.arc')
  t.assert.ok(!errors.length, 'Did not error')

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
  cwd = mockTmp({
    '.env': dotenv,
    'prefs.arc': prefsText,
  })
  inventory = inventoryDefaults({ cwd })
  errors = []
  preferences = getPrefs({ scope: 'local', inventory, errors }).preferences
  t.assert.ok(preferences, 'Got preferences')
  clean(preferences)
  t.assert.deepEqual(preferences, prefs, 'Got correct preferences from .env > prefs.arc')
  t.assert.ok(!errors.length, 'Did not error')

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
  cwd = mockTmp({
    '.env': dotenv,
  })
  inventory = inventoryDefaults({ cwd })
  errors = []
  preferences = getPrefs({ scope: 'local', inventory, errors }).preferences
  t.assert.ok(preferences, 'Got preferences')
  clean(preferences)
  t.assert.deepEqual(preferences, prefs, 'Got correct preferences from .env')
  t.assert.ok(!errors.length, 'Did not error')
})

test('Get preferences (only unknown items)', t => {
  t.plan(6)
  let prefs = { idk: { userland: true } }
  let prefsText = `
@idk
userland true
`
  let tmp = mockTmp({
    [path]: prefsText,
  })
  overrideHomedir(tmp)
  let inventory = inventoryDefaults({ cwd })
  let errors = []
  let { preferences, preferencesFile } = getPrefs({ scope: 'global', inventory, errors })
  t.assert.ok(preferences, 'Got preferences')
  t.assert.ok(preferences._arc, 'Got (arc object)')
  t.assert.ok(preferences._raw, 'Got (raw file)')
  t.assert.ok(preferencesFile, 'Got preferencesFile')
  clean(preferences)
  t.assert.deepEqual(preferences, prefs, 'Got correct preferences')
  t.assert.ok(!errors.length, 'Did not error')
})

test('Validate preferences', t => {
  t.plan(7)
  let mock = () => mockTmp({ [path]: prefsText })
  let errors, inventory, prefsText, tmp

  // Invalid @sandbox env
  prefsText = `
@sandbox
env foo
`
  tmp = mock()
  overrideHomedir(tmp)
  inventory = inventoryDefaults({ cwd })
  errors = []
  getPrefs({ scope: 'global', inventory, errors })
  t.assert.equal(errors.length, 1, `Invalid preferences errored: ${errors[0]}`)

  // Invalid @env pragma
  prefsText = `
@env
foo
`
  tmp = mock()
  overrideHomedir(tmp)
  inventory = inventoryDefaults({ cwd })
  errors = []
  getPrefs({ scope: 'global', inventory, errors })
  t.assert.equal(errors.length, 1, `Invalid preferences errored: ${errors[0]}`)

  // Invalid @env environments
  prefsText = `
@env
staging
  foo
`
  tmp = mock()
  overrideHomedir(tmp)
  inventory = inventoryDefaults({ cwd })
  errors = []
  getPrefs({ scope: 'global', inventory, errors })
  t.assert.equal(errors.length, 1, `Invalid preferences errored: ${errors[0]}`)

  prefsText = `
@env
staging
  env-var-1 foo
`
  tmp = mock()
  overrideHomedir(tmp)
  inventory = inventoryDefaults({ cwd })
  errors = []
  getPrefs({ scope: 'global', inventory, errors })
  t.assert.equal(errors.length, 1, `Invalid preferences errored: ${errors[0]}`)

  prefsText = `
@env
testing
  env_var_1 foo
  env_var_2 bar

staging
`
  tmp = mock()
  overrideHomedir(tmp)
  inventory = inventoryDefaults({ cwd })
  errors = []
  getPrefs({ scope: 'global', inventory, errors })
  t.assert.equal(errors.length, 1, `Invalid preferences errored: ${errors[0]}`)

  prefsText = `
@env
testing
  env_var_1 foo
  env_var_2 bar

staging true

production
  env_var_1 foo
  env_var_2 bar
`
  tmp = mock()
  overrideHomedir(tmp)
  inventory = inventoryDefaults({ cwd })
  errors = []
  getPrefs({ scope: 'global', inventory, errors })
  t.assert.equal(errors.length, 1, `Invalid preferences errored: ${errors[0]}`)

  prefsText = `
@env
testing foo

staging
  env_var_1 foo
  env_var_2 bar
`
  tmp = mock()
  overrideHomedir(tmp)
  inventory = inventoryDefaults({ cwd })
  errors = []
  getPrefs({ scope: 'global', inventory, errors })
  t.assert.equal(errors.length, 1, `Invalid preferences errored: ${errors[0]}`)
})
