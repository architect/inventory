let { join } = require('node:path')
let { test } = require('node:test')
let mockTmp = require('mock-tmp')
let cwd = process.cwd()
let { overrideHomedir } = require('../lib')
let inventory = require('../..')

let mock = join(cwd, 'test', 'mock')
let globalPrefsFile = '.prefs.arc'
let reset = () => {
  mockTmp.reset()
  overrideHomedir.reset()
}

test.beforeEach(reset)

/**
 * Duplicates some unit tests as part of the larger whole integration test
 * See: test/unit/src/config/project/preferences-test.js
 */
test('Set up env', t => {
  t.plan(1)
  t.assert.ok(inventory, 'Inventory entry is present')
})

test('Get global preferences', async t => {
  t.plan(11)
  let cwd = join(mock, 'prefs', 'global')
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
    [globalPrefsFile]: prefsText,
  })
  overrideHomedir(tmp)
  let result = await inventory({ cwd })
  let { inv, get } = result
  t.assert.ok(inv, 'Inventory returned inventory object')
  t.assert.ok(get, 'Inventory returned getter')
  t.assert.ok(inv._project.preferences, 'Got preferences')
  t.assert.deepEqual(inv._project.preferences, prefs, 'Got correct preferences')
  t.assert.ok(inv._project.globalPreferences, 'Got globalPreferences')
  t.assert.ok(inv._project.globalPreferences._arc, 'Got globalPreferences (arc object)')
  t.assert.ok(inv._project.globalPreferences._raw, 'Got globalPreferences (raw file)')
  t.assert.ok(!inv._project.localPreferences, 'Did not get localPreferences')
  t.assert.ok(!inv._project.localPreferencesFile, 'Did not get localPreferencesFile')
  // Delete the meta stuff so the actual preferences match the above
  delete inv._project.globalPreferences._arc
  delete inv._project.globalPreferences._raw
  t.assert.deepEqual(inv._project.globalPreferences, prefs, 'Got correct global preferences')
  t.assert.equal(inv._project.globalPreferencesFile, join(tmp, globalPrefsFile), 'Got correct preferences file')
})

test('Get local preferences', async t => {
  t.plan(11)
  let cwd = join(mock, 'max')
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
    create: { autocreate: true },
    deploy: false,
    env: {
      testing: { 'env_var_1': 'foo', 'env_var_2': 'bar' },
      staging: { 'env_var_1': 'fiz', 'env_var_2': 'buz' },
      production: { 'env_var_1': 'qix qix', 'env_var_2': 'qux qux' },
    },
  }
  let result = await inventory({ cwd })
  let { inv, get } = result
  t.assert.ok(inv, 'Inventory returned inventory object')
  t.assert.ok(get, 'Inventory returned getter')
  t.assert.ok(inv._project.preferences, 'Got preferences')
  t.assert.deepEqual(inv._project.preferences, prefs, 'Got correct preferences')
  t.assert.ok(inv._project.localPreferences, 'Got localPreferences')
  t.assert.ok(inv._project.localPreferences._arc, 'Got localPreferences (arc object)')
  t.assert.ok(inv._project.localPreferences._raw, 'Got localPreferences (raw file)')
  t.assert.ok(!inv._project.globalPreferences, 'Did not get globalPreferences')
  t.assert.ok(!inv._project.globalPreferencesFile, 'Did not get globalPreferencesFile')
  // Delete the meta stuff so the actual preferences match the above
  delete inv._project.localPreferences._arc
  delete inv._project.localPreferences._raw
  t.assert.deepEqual(inv._project.localPreferences, prefs, 'Got correct local preferences')
  t.assert.equal(inv._project.localPreferencesFile, join(cwd, 'preferences.arc'), 'Got correct preferences file')
})


test('Layer local preferences over global preferences', async t => {
  t.plan(14)
  let cwd = join(mock, 'prefs', 'local-over-global')
  let globalPrefsText = `
@sandbox
environment testing
quiet true

@deploy
false

@env
testing
  env_var_1 foo
  env_var_2 bar
`
  let globalPrefs = {
    sandbox: {
      environment: 'testing',
      quiet: true,
    },
    deploy: false,
    env: {
      testing: { 'env_var_1': 'foo', 'env_var_2': 'bar' },
      staging: null,
      production: null,
    },
  }
  let localPrefs = {
    sandbox: {
      environment: 'staging',
    },
    create: {
      autocreate: true,
    },
    env: {
      testing: { 'env_var_2': 'bar' },
      staging: { 'env_var_3': 'fiz' },
      production: null,
    },
  }
  let prefs = {
    sandbox: {
      environment: 'staging',
      quiet: true,
    },
    deploy: false,
    create: {
      autocreate: true,
    },
    env: {
      testing: { 'env_var_2': 'bar' },
      staging: { 'env_var_3': 'fiz' },
      production: null,
    },
  }
  let tmp = mockTmp({
    [globalPrefsFile]: globalPrefsText,
  })
  overrideHomedir(tmp)
  let result = await inventory({ cwd })
  let { inv, get } = result
  t.assert.ok(inv, 'Inventory returned inventory object')
  t.assert.ok(get, 'Inventory returned getter')
  t.assert.ok(inv._project.preferences, 'Got preferences')
  t.assert.deepEqual(inv._project.preferences, prefs, 'Got correct preferences')
  t.assert.ok(inv._project.globalPreferences, 'Got globalPreferences')
  t.assert.ok(inv._project.globalPreferences._arc, 'Got globalPreferences (arc object)')
  t.assert.ok(inv._project.globalPreferences._raw, 'Got globalPreferences (raw file)')
  t.assert.ok(inv._project.localPreferences, 'Got localPreferences')
  t.assert.ok(inv._project.localPreferences._arc, 'Got localPreferences (arc object)')
  t.assert.ok(inv._project.localPreferences._raw, 'Got localPreferences (raw file)')
  // Delete the meta stuff so the actual preferences match the above
  delete inv._project.globalPreferences._arc
  delete inv._project.globalPreferences._raw
  delete inv._project.localPreferences._arc
  delete inv._project.localPreferences._raw
  t.assert.deepEqual(inv._project.globalPreferences, globalPrefs, 'Got correct global preferences')
  t.assert.deepEqual(inv._project.localPreferences, localPrefs, 'Got correct local preferences')
  t.assert.equal(inv._project.globalPreferencesFile, join(tmp, globalPrefsFile), 'Got correct preferences file')
  t.assert.equal(inv._project.localPreferencesFile, join(cwd, 'preferences.arc'), 'Got correct preferences file')
})

test('Preferences validation errors', async t => {
  t.plan(1)
  let arc = `@app\nfoo`
  let prefs = `
@env
foo
`
  let cwd = mockTmp({
    'app.arc': arc,
    'prefs.arc': prefs,
  })
  t.assert.rejects(inventory({ cwd }), /Invalid preferences setting: @env foo/, 'Got back error message for invalid preferences')
})
