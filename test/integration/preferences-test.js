let { join } = require('path')
let { homedir } = require('os')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'index')
let inv = require(sut)
let mockFs = require('mock-fs')

let mock = join(process.cwd(), 'test', 'mock')
let arc = '@app\nappname\n@events\nan-event' // Not using @http so we can skip ASAP filesystem checks
let reset = () => mockFs.restore()

/**
 * Duplicates some unit tests as part of the larger whole integration test
 * See: test/unit/src/config/project/preferences-test.js
 */
test('Set up env', t => {
  t.plan(1)
  t.ok(inv, 'Inventory entry is present')
})

test('Get global preferences', t => {
  t.plan(11)
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
  let path = join(homedir(), '.prefs.arc')
  mockFs({
    'app.arc': arc,
    [path]: prefsText
  })
  inv({}, (err, result) => {
    if (err) t.fail(err)
    else {
      mockFs.restore()
      let { inv, get } = result
      t.ok(inv, 'Inventory returned inventory object')
      t.ok(get, 'Inventory returned getter')
      t.ok(inv._project.preferences, 'Got preferences')
      t.deepEqual(inv._project.preferences, prefs, 'Got correct preferences')
      t.ok(inv._project.globalPreferences, 'Got globalPreferences')
      t.ok(inv._project.globalPreferences._arc, 'Got globalPreferences (arc object)')
      t.ok(inv._project.globalPreferences._raw, 'Got globalPreferences (raw file)')
      t.notOk(inv._project.localPreferences, 'Did not get localPreferences')
      t.notOk(inv._project.localPreferencesFile, 'Did not get localPreferencesFile')
      // Delete the meta stuff so the actual preferences match the above
      delete inv._project.globalPreferences._arc
      delete inv._project.globalPreferences._raw
      t.deepEqual(inv._project.globalPreferences, prefs, 'Got correct global preferences')
      t.equal(inv._project.globalPreferencesFile, path, 'Got correct preferences file')
      t.teardown(reset)
    }
  })
})

test('Get local preferences', t => {
  t.plan(11)
  let cwd = join(mock, 'max')
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
    create: { autocreate: true },
    deploy: false,
    env: {
      testing: { 'env-var-1': 'foo', 'env-var-2': 'bar' },
      staging: { 'env-var-1': 'fiz', 'env-var-2': 'buz' },
      production: { 'env-var-1': 'qix qix', 'env-var-2': 'qux qux' }
    },
  }
  inv({ cwd }, (err, result) => {
    if (err) t.fail(err)
    else {
      let { inv, get } = result
      t.ok(inv, 'Inventory returned inventory object')
      t.ok(get, 'Inventory returned getter')
      t.ok(inv._project.preferences, 'Got preferences')
      t.deepEqual(inv._project.preferences, prefs, 'Got correct preferences')
      t.ok(inv._project.localPreferences, 'Got localPreferences')
      t.ok(inv._project.localPreferences._arc, 'Got localPreferences (arc object)')
      t.ok(inv._project.localPreferences._raw, 'Got localPreferences (raw file)')
      t.notOk(inv._project.globalPreferences, 'Did not get globalPreferences')
      t.notOk(inv._project.globalPreferencesFile, 'Did not get globalPreferencesFile')
      // Delete the meta stuff so the actual preferences match the above
      delete inv._project.localPreferences._arc
      delete inv._project.localPreferences._raw
      t.deepEqual(inv._project.localPreferences, prefs, 'Got correct local preferences')
      t.equal(inv._project.localPreferencesFile, join(cwd, 'preferences.arc'), 'Got correct preferences file')
      t.teardown(reset)
    }
  })
})


test('Layer local preferences over global preferences', t => {
  t.plan(14)
  let globalPrefsText = `
@sandbox
environment testing
quiet true

@deploy
false

@env
testing
  env-var-1 foo
  env-var-2 bar
`
  let globalPrefs = {
    sandbox: {
      environment: 'testing',
      quiet: true
    },
    deploy: false,
    env: {
      testing: { 'env-var-1': 'foo', 'env-var-2': 'bar' },
      staging: null,
      production: null,
    }
  }
  let localPrefsText = `
@sandbox
environment staging

@create
autocreate true

@env
testing
  env-var-2 bar
staging
  env-var-3 fiz
`
  let localPrefs = {
    sandbox: {
      environment: 'staging',
    },
    create: {
      autocreate: true
    },
    env: {
      testing: { 'env-var-2': 'bar' },
      staging: { 'env-var-3': 'fiz' },
      production: null,
    }
  }
  let prefs = {
    sandbox: {
      environment: 'staging',
      quiet: true
    },
    deploy: false,
    create: {
      autocreate: true
    },
    env: {
      testing: { 'env-var-2': 'bar' },
      staging: { 'env-var-3': 'fiz' },
      production: null,
    }
  }
  let path = join(homedir(), '.prefs.arc')
  mockFs({
    'app.arc': arc,
    [path]: globalPrefsText,
    'preferences.arc': localPrefsText
  })
  inv({}, (err, result) => {
    if (err) t.fail(err)
    else {
      mockFs.restore()
      let { inv, get } = result
      t.ok(inv, 'Inventory returned inventory object')
      t.ok(get, 'Inventory returned getter')
      t.ok(inv._project.preferences, 'Got preferences')
      t.deepEqual(inv._project.preferences, prefs, 'Got correct preferences')
      t.ok(inv._project.globalPreferences, 'Got globalPreferences')
      t.ok(inv._project.globalPreferences._arc, 'Got globalPreferences (arc object)')
      t.ok(inv._project.globalPreferences._raw, 'Got globalPreferences (raw file)')
      t.ok(inv._project.localPreferences, 'Got localPreferences')
      t.ok(inv._project.localPreferences._arc, 'Got localPreferences (arc object)')
      t.ok(inv._project.localPreferences._raw, 'Got localPreferences (raw file)')
      // Delete the meta stuff so the actual preferences match the above
      delete inv._project.globalPreferences._arc
      delete inv._project.globalPreferences._raw
      delete inv._project.localPreferences._arc
      delete inv._project.localPreferences._raw
      t.deepEqual(inv._project.globalPreferences, globalPrefs, 'Got correct global preferences')
      t.deepEqual(inv._project.localPreferences, localPrefs, 'Got correct local preferences')
      t.equal(inv._project.globalPreferencesFile, path, 'Got correct preferences file')
      t.equal(inv._project.localPreferencesFile, join(process.cwd(), 'preferences.arc'), 'Got correct preferences file')
      t.teardown(reset)
    }
  })
})

test('Preferences validation errors', async t => {
  t.plan(1)
  let arc = `@app\nfoo`
  let prefs = `
@env
foo
`
  mockFs({
    'app.arc': arc,
    'prefs.arc': prefs,
  })
  try {
    await inv({})
    t.fail('Expected an error')
  }
  catch (err) {
    mockFs.restore()
    t.match(err.message, /Invalid preferences setting: @env foo/, 'Got back error message for invalid preferences')
  }
})
